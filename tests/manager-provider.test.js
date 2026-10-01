import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ init: vi.fn(() => ({ info: vi.fn() })), effect: null }))
vi.mock('react', () => ({ useEffect: (callback) => { mocks.effect = callback } }))
vi.mock('../lib/manager/logger', () => ({ initLogger: mocks.init }))
const ENV = { NEXT_PUBLIC_MANAGER_ENDPOINT: 'http://localhost:3300/', NEXT_PUBLIC_MANAGER_APP_ID: 'portfolio', NEXT_PUBLIC_MANAGER_CLIENT_KEY: 'mck_fake', NEXT_PUBLIC_MANAGER_ANALYTICS_KEY: 'mak_fake' }
let scripts
beforeEach(() => {
  vi.resetModules(); mocks.init.mockClear(); scripts = []
  for (const [key,value] of Object.entries(ENV)) vi.stubEnv(key,value)
  vi.stubGlobal('window', {})
  vi.stubGlobal('document', {
    getElementById: (id) => scripts.find((script) => script.id === id),
    createElement: () => ({ dataset: {} }), head: { appendChild: (script) => scripts.push(script) },
  })
})
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })
async function mount() { const { default: Provider } = await import('../lib/manager/ManagerProvider.tsx'); Provider(); mocks.effect() }
describe('Manager browser boot', () => {
  it('starts logging and analytics only once across repeated mounts', async () => {
    await mount(); await mount()
    expect(mocks.init).toHaveBeenCalledTimes(1)
    expect(scripts).toHaveLength(1)
    expect(scripts[0]).toMatchObject({ src: 'http://localhost:3300/t.js?v=1', dataset: { app: 'portfolio', key: 'mak_fake' } })
    expect(scripts[0].src).not.toContain('mak_fake')
  })
  it('analytics loads without a client log key', async () => {
    vi.stubEnv('NEXT_PUBLIC_MANAGER_CLIENT_KEY','')
    await mount(); expect(mocks.init).not.toHaveBeenCalled(); expect(scripts).toHaveLength(1)
  })
  it('logs work without analytics and never receive a server key', async () => {
    vi.stubEnv('NEXT_PUBLIC_MANAGER_ANALYTICS_KEY',''); vi.stubEnv('MANAGER_LOG_KEY','mlk_private')
    await mount(); expect(scripts).toHaveLength(0)
    expect(mocks.init.mock.calls[0][0].apiKey).toBe('mck_fake')
    expect(JSON.stringify(mocks.init.mock.calls)).not.toContain('mlk_private')
  })
  it('logger initialization failure still lets analytics start', async () => {
    mocks.init.mockImplementationOnce(() => { throw new Error('failed') })
    await expect(mount()).resolves.toBeUndefined(); expect(scripts).toHaveLength(1)
  })
})
