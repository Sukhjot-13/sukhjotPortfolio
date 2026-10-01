import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'

const state = vi.hoisted(() => ({ callbacks: [] }))
vi.mock('next/server', async (original) => ({ ...(await original()), after: (fn) => state.callbacks.push(fn) }))
const ENV = { MANAGER_ENDPOINT: 'http://localhost:3300', MANAGER_APP_ID: 'portfolio', MANAGER_LOG_KEY: 'mlk_test' }
const shutdowns = new Set()
async function load() {
  vi.resetModules()
  const mod = await import('../lib/manager/server.ts')
  shutdowns.add((await import('../lib/manager/logger.ts')).shutdownLoggers)
  return mod
}
function fakeLogger() {
  const entries = []
  const root = { entries, flush: vi.fn(async () => {}), droppedCount: () => 0,
    withTrace: vi.fn((traceId) => Object.fromEntries(['info','warn','error'].map((level) => [level, (message, meta) => entries.push({ level, message, meta, traceId })]))),
    info: vi.fn(), error: vi.fn(), setContext: vi.fn(), newTrace: vi.fn() }
  return root
}
beforeEach(() => {
  for (const [key,value] of Object.entries(ENV)) vi.stubEnv(key,value)
  state.callbacks = []
  delete globalThis.__managerServerLogger
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({ accepted: 1, rejected: 0 })))
})
afterEach(() => {
  for (const close of shutdowns) close()
  shutdowns.clear()
  delete globalThis.__managerServerLogger
  vi.unstubAllEnvs(); vi.unstubAllGlobals()
})

describe('request tracing and delivery', () => {
  it('isolates concurrent browser traces, logs each real status, schedules a flush, omits query data', async () => {
    const mod = await load(); const root = fakeLogger(); globalThis.__managerServerLogger = root
    const handler = mod.withManagerLogs(async (request) => {
      await new Promise((resolve) => setTimeout(resolve, request.headers.get('x-delay') === 'yes' ? 15 : 0))
      mod.logServerEvent('business_event', { trace: mod.getRequestTraceId() })
      return new Response(null, { status: request.headers.get('x-delay') === 'yes' ? 404 : 200 })
    })
    await Promise.all([
      handler(new Request('http://localhost/api/projects?password=private', { headers: { 'x-trace-id': 'trace_one', 'x-delay': 'yes' } })),
      handler(new Request('http://localhost/api/projects', { headers: { 'x-trace-id': 'trace_two' } })),
    ])
    expect(root.withTrace.mock.calls.map(([trace]) => trace).sort()).toEqual(['trace_one','trace_two'])
    const events = root.entries.filter((entry) => entry.message === 'business_event')
    for (const entry of events) expect(entry.meta.trace).toBe(entry.traceId)
    expect(root.entries.filter((e) => e.message === 'request_completed').map((e) => e.meta.status).sort()).toEqual([200,404])
    expect(JSON.stringify(root.entries)).not.toContain('private')
    expect(root.setContext).not.toHaveBeenCalled(); expect(root.newTrace).not.toHaveBeenCalled()
    expect(state.callbacks).toHaveLength(2)
    await Promise.all(state.callbacks.map((fn) => fn()))
    expect(root.flush).toHaveBeenCalledTimes(2)
    expect(mod.getRequestTraceId()).toBe('')
  })
  it('captures uncaught errors and rethrows the original with completion delivery', async () => {
    const mod = await load(); const root = fakeLogger(); globalThis.__managerServerLogger = root
    const error = new Error('synthetic failure')
    await expect(mod.withManagerLogs(async () => { throw error })(new Request('http://localhost/api/test'))).rejects.toBe(error)
    expect(root.entries.find((e) => e.message === 'unhandled_route_error').meta.error.stack).toContain('synthetic failure')
    expect(root.entries.find((e) => e.message === 'request_completed').meta.outcome).toBe('threw')
    expect(state.callbacks).toHaveLength(1)
  })
  it('classifies Next redirects without false exception logs and preserves rejection results', async () => {
    const mod = await load(); const root = fakeLogger(); globalThis.__managerServerLogger = root
    const redirect = Object.assign(new Error('NEXT_REDIRECT'), { digest: 'NEXT_REDIRECT;replace;/login;303;' })
    await expect(mod.withManagerLogs(async () => { throw redirect })(new Request('http://localhost/actions'))).rejects.toBe(redirect)
    expect(root.entries.some((e) => e.level === 'error')).toBe(false)
    expect(root.entries[0].meta).toMatchObject({ outcome: 'redirect', status: 303 })
    const result = { success: false, error: 'Validation failed' }
    expect(await mod.withManagerLogs(async () => result)()).toBe(result)
    expect(root.entries.at(-1).meta.outcome).toBe('rejected')
  })
  it('SDK emit/flush failures do not replace application results', async () => {
    const mod = await load(); const root = fakeLogger(); globalThis.__managerServerLogger = root
    root.withTrace.mockImplementation(() => { throw new Error('SDK failure') })
    root.info.mockImplementation(() => { throw new Error('SDK failure') })
    root.flush.mockRejectedValue(new Error('offline'))
    const response = Response.json({ ok: true })
    expect(await mod.withManagerLogs(async () => response)()).toBe(response)
    await expect(state.callbacks[0]()).resolves.toBeUndefined()
  })
  it('disabled Manager does not initialize a logger or schedule work', async () => {
    vi.stubEnv('MANAGER_LOG_KEY', '')
    const mod = await load(); const result = Response.json({ ok: true })
    expect(await mod.withManagerLogs(async () => result)()).toBe(result)
    expect(state.callbacks).toHaveLength(0)
    expect(globalThis.__managerServerLogger).toBeUndefined()
  })
})

describe('route and client boundaries', () => {
  function routeFiles(dir) {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => entry.isDirectory()
      ? routeFiles(path.join(dir,entry.name)) : entry.name === 'route.ts' ? [path.join(dir,entry.name)] : [])
  }
  it('wraps every public API verb and keeps server lifecycle outside the provider', () => {
    for (const file of routeFiles(path.resolve('app/api'))) {
      const source = readFileSync(file,'utf8')
      expect(source).toMatch(/export const (GET|POST) = withManagerLogs\(/)
      expect(source).not.toMatch(/export async function (GET|POST)/)
    }
    const provider = readFileSync('lib/manager/ManagerProvider.tsx','utf8')
    expect(provider).toContain('from "./config"')
    expect(provider).not.toMatch(/from ['"]\.\/(index|server)['"]/)
  })
})
