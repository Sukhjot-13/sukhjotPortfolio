/** Server-only lifecycle and request tracing. Browser code imports config.ts only. */
import { AsyncLocalStorage } from 'node:async_hooks'
import { randomUUID } from 'node:crypto'
import { after } from 'next/server'
import { initLogger, traceIdFromHeaders } from './logger'
import { managerConfig } from './config'
import { FLUSH_INTERVAL_MS, REDACT_KEYS } from './server-options'

export type LogMeta = Record<string, unknown> | unknown[];

/** The slice of the SDK logger this integration actually calls. */
type ManagerLogger = {
  trace: (message: string, meta?: LogMeta) => void;
  debug: (message: string, meta?: LogMeta) => void;
  info: (message: string, meta?: LogMeta) => void;
  warn: (message: string, meta?: LogMeta) => void;
  error: (message: string, meta?: LogMeta) => void;
  fatal: (message: string, meta?: LogMeta) => void;
  child: (bindings: LogMeta) => ManagerLogger;
  time: (label: string) => void;
  timeEnd: (label: string, meta?: LogMeta) => number | null;
  flush: () => Promise<void>;
  droppedCount: () => number;
  setContext: (patch: LogMeta) => void;
  withTrace: (traceId: string) => ManagerLogger;
  newTrace: () => string;
};

const noop = () => {};

const NOOP_LOGGER: ManagerLogger = {
  trace: noop,
  debug: noop,
  info: noop,
  warn: noop,
  error: noop,
  fatal: noop,
  child: () => NOOP_LOGGER,
  time: noop,
  timeEnd: () => 0,
  flush: async () => {},
  droppedCount: () => 0,
  setContext: noop,
  withTrace: () => NOOP_LOGGER,
  newTrace: () => '',
};

const GLOBAL_KEY = '__managerServerLogger';
const scope = globalThis as unknown as Record<string, ManagerLogger | undefined>;

/** Levels that must never wait for the batch window. */
const IMMEDIATE_LEVELS = new Set(['error', 'fatal']);

/**
 * Minimum gap between two urgent flushes. A burst of 50 errors costs one request
 * now and one at the end of the window, not 50.
 */
const URGENT_FLUSH_MIN_GAP_MS = 100;

let lastUrgentFlushAt = 0;
let urgentTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * The logger is created lazily, on first use, and cached on globalThis.
 *
 * Two reasons it is not created during app boot:
 *  - server frameworks compile route handlers and startup hooks into separate
 *    module graphs, so an instance created at boot can be a different object than
 *    the one a request sees;
 *  - a Next.js server (and Vercel functions in particular) can freeze timers once
 *    a response is sent, so a logger that only relies on its background flush
 *    timer can lose entries created outside a request.
 * Creating it on demand inside the request — with a 250ms batch window and a
 * leading-edge flush for error/fatal — avoids both.
 */
function cachedLogger(): ManagerLogger | null {
  return scope[GLOBAL_KEY] ?? null;
}

/**
 * Creates the server logger on first use and caches it on globalThis so every
 * module instance in the process shares one queue. Safe to call repeatedly.
 * Never throws: an observability outage must not take the app down.
 */
export function startManagerLogger(): ManagerLogger {
  if (!managerConfig.enabled) {
    return NOOP_LOGGER;
  }
  const existing = cachedLogger();
  if (existing !== null) {
    return existing;
  }
  try {
    const logger: ManagerLogger = initLogger({
      endpoint: managerConfig.endpoint as string,
      appId: managerConfig.appId as string,
      apiKey: managerConfig.apiKey as string,
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
      release: process.env.VERCEL_GIT_COMMIT_SHA || process.env.GIT_SHA || 'dev',
      captureConsole: null,
      captureGlobalErrors: false,
      captureProcessErrors: false,
      captureFetch: false,
      redactKeys: REDACT_KEYS,
      sampleRate: process.env.NODE_ENV === 'production' ? { debug: 0.1, trace: 0 } : {},
      flushIntervalMs: FLUSH_INTERVAL_MS,
    });
    scope[GLOBAL_KEY] = logger;
    logger.info('manager_logger_started', { source: 'server' });
    return logger;
  } catch (err) {
    console.warn('[manager] logger failed to start:', err instanceof Error ? err.message : err);
    return NOOP_LOGGER;
  }
}

/** The server logger, created on first use and cached on globalThis. Never null. */
export function getManagerLogger(): ManagerLogger {
  return cachedLogger() ?? startManagerLogger();
}

/**
 * Emits a server log.
 *
 * Routine levels ride the SDK's 250ms batch window (one request per burst, not
 * per line). error/fatal flush straight away so a crash right after logging
 * cannot strand the entry. Fire-and-forget: never awaits, never throws.
 */
export function managerLog(level: string, message: string, meta: LogMeta = {}): void {
  if (!managerConfig.enabled) return;
  try {
    const log = requestStorage.getStore()?.log ?? getManagerLogger();
    const fn = (log as unknown as Record<string, ((m: string, d?: LogMeta) => void) | undefined>)[
      level
    ];
    const emit = typeof fn === 'function' ? fn : log.info;
    emit.call(log, message, meta);
    if (IMMEDIATE_LEVELS.has(level)) {
      scheduleUrgentFlush(log);
    }
  } catch {
    /* observability must never throw */
  }
}

/**
 * Leading-edge flush: send now if the last urgent send was long enough ago,
 * otherwise schedule one for the end of the gap so nothing is stranded.
 */
function scheduleUrgentFlush(log: ManagerLogger): void {
  const send = (): void => {
    urgentTimer = null;
    lastUrgentFlushAt = Date.now();
    try {
      const flushed = log.flush()
      if (flushed && typeof flushed.catch === 'function') flushed.catch(() => {})
    } catch { /* an urgent timer must never throw into the application */ }
  };
  const elapsed = Date.now() - lastUrgentFlushAt;
  if (elapsed >= URGENT_FLUSH_MIN_GAP_MS) {
    send();
    return;
  }
  if (urgentTimer === null) {
    urgentTimer = setTimeout(send, URGENT_FLUSH_MIN_GAP_MS - elapsed);
    if (typeof urgentTimer.unref === 'function') {
      urgentTimer.unref();
    }
  }
}

/** How many entries this client discarded (rate limit / queue overflow). */
export function getManagerDroppedCount(): number {
  const log = cachedLogger();
  return log !== null && typeof log.droppedCount === 'function' ? log.droppedCount() : 0;
}

/** Records an API route outcome. Call from route handlers and server actions. */
export function logServerEvent(message: string, meta: LogMeta = {}): void {
  managerLog('info', message, meta);
}

/** Records a failure. `error` may be an Error or a plain object. */
export function logServerError(message: string, error: unknown, meta: LogMeta = {}): void {
  managerLog('error', message, {
    ...meta,
    error:
      error instanceof Error
        ? { name: error.name, message: error.message, stack: error.stack }
        : error,
  });
}


type RequestState = { log: ManagerLogger; traceId: string }
const requestStorage = new AsyncLocalStorage<RequestState>()

/** Current trace is owned by this request, never mutable shared SDK context. */
export function getRequestTraceId(): string {
  return requestStorage.getStore()?.traceId ?? ''
}

/** Explicit flush for jobs outside a Next.js request. */
export async function flushManagerLogger(): Promise<void> {
  try { await cachedLogger()?.flush() } catch { /* logging must not fail the app */ }
}

/** Preserve arguments/results, trace concurrent requests independently, flush on every exit. */
export function withManagerLogs<Args extends unknown[], Result>(
  handler: (...args: Args) => Promise<Result>,
): (...args: Args) => Promise<Result> {
  return async (...args: Args): Promise<Result> => {
    if (!managerConfig.enabled) return handler(...args)
    const root = getManagerLogger()
    const request = args[0] instanceof Request ? args[0] : null
    const traceId = traceIdFromHeaders(request?.headers) || randomUUID()
    let log = root
    try { log = root.withTrace(traceId) } catch { /* tolerate SDK failures */ }
    let route = request?.method ?? 'GET'
    try { if (request) route += ` ${new URL(request.url).pathname}` } catch { /* no query or credentials */ }
    const startedAt = Date.now()
    let status: number | undefined
    let outcome = 'response'
    return requestStorage.run({ log, traceId }, async () => {
      try {
        const result = await handler(...args)
        if (result instanceof Response) {
          status = result.status
          if (status >= 300 && status < 400) outcome = 'redirect'
        } else if (result && typeof result === 'object' && 'success' in result && result.success === false) {
          outcome = 'rejected'
        }
        return result
      } catch (error) {
        const digest = error && typeof error === 'object' && 'digest' in error ? String(error.digest) : ''
        if (digest.startsWith('NEXT_REDIRECT;')) {
          outcome = 'redirect'
          status = 303
        } else {
          outcome = 'threw'
          logServerError('unhandled_route_error', error, { route })
        }
        throw error
      } finally {
        logServerEvent('request_completed', { route, durationMs: Date.now() - startedAt, status, outcome })
        try { after(flushManagerLogger) } catch { /* outside request: SDK timer remains available */ }
      }
    })
  }
}
