#!/usr/bin/env node
/**
 * Measures log-delivery overhead for a realistic burst.
 *
 * Fires N log lines at the integration facade the way a request handler would,
 * counts the HTTP requests that actually reach the ingest endpoint, and reports
 * latency.
 *
 * Usage: node scripts/measure-log-delivery.mjs [count]
 * Env:  MANAGER_ENDPOINT, MANAGER_LOG_KEY, MANAGER_APP_ID
 *
 * The standalone SDK/config are TypeScript, so Node resolves their imports explicitly. This repo has no
 * bundler dependency, so the script installs a resolve hook that appends the
 * `.ts` extension to extensionless SDK/config imports, then lets
 * Node's own type stripping do the transform. That also proves the extensionless
 * specifier resolves outside Turbopack.
 */
import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const count = Number(process.argv[2] ?? 200);
const endpoint = (process.env.MANAGER_ENDPOINT ?? "http://127.0.0.1:3300").replace(/\/$/, "");
const apiKey = process.env.MANAGER_LOG_KEY ?? "";
const appId = process.env.MANAGER_APP_ID ?? "sukhjotportfolio";

if (apiKey === "") {
  process.stderr.write("MANAGER_LOG_KEY is required\n");
  process.exit(2);
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (
      specifier.startsWith(".") &&
      !/\.[cm]?[jt]sx?$/.test(specifier) &&
      context.parentURL?.startsWith("file:")
    ) {
      const base = path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier);
      for (const candidate of [`${base}.ts`, path.join(base, "index.ts")]) {
        if (existsSync(candidate)) return nextResolve(pathToFileURL(candidate).href, context);
      }
    }
    return nextResolve(specifier, context);
  },
});

const ingestPath = `${endpoint}/api/ingest/logs`;

let requests = 0;
let entries = 0;
let accepted = 0;
let failedRequests = 0;
const timings = [];

const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = typeof input === "string" ? input : String(input?.url ?? input);
  if (url.includes(ingestPath)) {
    requests += 1;
    if (typeof init?.body === "string") {
      try {
        const parsed = JSON.parse(init.body);
        entries += Array.isArray(parsed.logs) ? parsed.logs.length : 0;
      } catch {
        /* ignore */
      }
    }
    const started = performance.now();
    const response = await originalFetch(input, init);
    timings.push(performance.now() - started);
    try {
      const result = await response.clone().json();
      if (!response.ok || !Number.isInteger(result.accepted) || result.rejected !== 0) {
        failedRequests += 1;
      } else {
        accepted += result.accepted;
      }
    } catch { failedRequests += 1; }
    return response;
  }
  return originalFetch(input, init);
};

const modulePath = path.resolve(import.meta.dirname, process.env.MANAGER_MODULE ?? '../lib/manager/config.ts');
const { managerConfig } = await import(pathToFileURL(modulePath).href);
const { initLogger } = await import(pathToFileURL(path.join(path.dirname(modulePath), 'logger.ts')).href);
const { FLUSH_INTERVAL_MS, REDACT_KEYS } = await import(pathToFileURL(path.join(path.dirname(modulePath), 'server-options.ts')).href);
const log = initLogger({ endpoint: managerConfig.endpoint, appId: managerConfig.appId,
  apiKey: managerConfig.apiKey, environment: 'measurement', captureConsole: null,
  captureGlobalErrors: false, captureProcessErrors: false, captureFetch: false,
  redactKeys: REDACT_KEYS, flushIntervalMs: FLUSH_INTERVAL_MS });
const managerLog = (level, message, meta) => log[level](message, meta);
const getManagerDroppedCount = () => log.droppedCount();

// Fire in paced chunks so the SDK's self rate-limiter is not the thing under test.
const perChunk = Number(process.env.MEASURE_CHUNK ?? 20);
const gapMs = Number(process.env.MEASURE_GAP_MS ?? 100);

const started = performance.now();
for (let index = 0; index < count; index += 1) {
  const level = index % 10 === 0 ? "error" : "info";
  managerLog(level, `burst_probe_${index}`, { index, filler: "x".repeat(120) });
  if ((index + 1) % perChunk === 0 && index + 1 < count) {
    await new Promise((resolve) => setTimeout(resolve, gapMs));
  }
}
const enqueueMs = performance.now() - started;

await new Promise((resolve) => setTimeout(resolve, 2500));
await log.flush();

const total = timings.reduce((sum, value) => sum + value, 0);
process.stdout.write(`project           : ${appId}\n`);
process.stdout.write(`entries fired     : ${count}\n`);
process.stdout.write(
  `enqueue time      : ${enqueueMs.toFixed(1)}ms (logging must not block the request)\n`,
);
process.stdout.write(`ingest requests   : ${requests}\n`);
process.stdout.write(`entries attempted : ${entries}\n`);
process.stdout.write(
  `entries/request   : ${requests === 0 ? 0 : (entries / requests).toFixed(1)}\n`,
);
process.stdout.write(`http time total   : ${total.toFixed(1)}ms\n`);
process.stdout.write(`requests/1k lines : ${((requests / count) * 1000).toFixed(1)}\n`);
process.stdout.write(`entries accepted  : ${accepted}\n`);
process.stdout.write(`failed requests   : ${failedRequests}\n`);
process.stdout.write(`sdk dropped       : ${getManagerDroppedCount()}\n`);
process.stdout.write(`fired per second  : ${(count / (enqueueMs / 1000)).toFixed(0)}\n`);

globalThis.fetch = originalFetch;
if (accepted !== count || failedRequests > 0 || getManagerDroppedCount() > 0) process.exitCode = 1;
