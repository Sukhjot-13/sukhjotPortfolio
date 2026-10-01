import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
let sdk, log, calls, batches, listeners, uploadGate
beforeEach(async () => {
  vi.resetModules(); calls=[]; batches=[]; listeners={}; uploadGate=null
  vi.stubGlobal('window',{location:{href:'http://localhost:3000/',origin:'http://localhost:3000',pathname:'/'},history:{pushState(){},replaceState(){}},addEventListener:(name,fn)=>{listeners[name]=fn},localStorage:{getItem:()=>null,setItem(){},removeItem(){}}})
  vi.stubGlobal('document',{referrer:''})
  vi.stubGlobal('console',{...console,warn:vi.fn(),error:vi.fn()})
  window.console=console
  vi.stubGlobal('navigator',{language:'en',userAgent:'Browser'})
  vi.stubGlobal('fetch',vi.fn(async (input,init)=>{if(String(input).startsWith('http://manager.test')){if(uploadGate)await uploadGate;batches.push(JSON.parse(init.body));}else calls.push([input,init]);return Response.json({accepted:1,rejected:0})}))
  sdk=await import('../lib/manager/logger.ts')
  log=sdk.initLogger({endpoint:'http://manager.test',appId:'portfolio',apiKey:'mck_test',captureConsole:['warn','error'],captureGlobalErrors:true,captureFetch:true,flushIntervalMs:10000,redactKeys:['password']})
})
afterEach(()=>{sdk?.shutdownLoggers(); vi.unstubAllGlobals()})
const trace = () => new Headers(calls[0][1].headers).get('x-trace-id')
describe('current Manager browser SDK',()=>{
  it('traces ordinary fetch with no options',async()=>{await fetch('/api/projects');expect(trace()).toBe(log.traceId())})
  it.each([{headers:{'x-custom':'kept'}},{headers:[['x-custom','kept']]},{headers:new Headers({'x-custom':'kept'})}])('clones supported headers without mutating callers',async(init)=>{
    const original=new Headers(init.headers);await fetch('/api/projects',init);expect(trace()).toBe(log.traceId());expect(new Headers(calls[0][1].headers).get('x-custom')).toBe('kept');expect(new Headers(init.headers).get('x-trace-id')).toBe(original.get('x-trace-id'))
  })
  it('inherits Request headers and keeps third-party requests untraced',async()=>{
    const request=new Request('http://localhost:3000/api/projects',{headers:{'x-custom':'request'}});await fetch(request);expect(trace()).toBe(log.traceId());expect(new Headers(calls[0][1].headers).get('x-custom')).toBe('request');expect(request.headers.get('x-trace-id')).toBeNull()
    await fetch('https://other.test/api');expect(new Headers(calls[1][1].headers).get('x-trace-id')).toBeNull()
  })
  it('captures global errors and rejected promises and redacts before upload',async()=>{
    listeners.error({message:'uncaught_probe',error:new Error('uncaught_probe'),filename:'test.js',lineno:1,colno:1});listeners.unhandledrejection({reason:new Error('rejection_probe')});log.info('redaction_probe',{password:'private-probe'});await log.flush();const rows=batches.flatMap(b=>b.logs);expect(rows.some(x=>x.message==='uncaught_probe'&&x.level==='fatal'&&x.stack.includes('uncaught_probe'))).toBe(true);expect(rows.some(x=>x.message==='unhandled_rejection')).toBe(true);expect(JSON.stringify(rows)).not.toContain('private-probe')
  })
  it('keeps unrelated console errors visible during an in-flight upload',async()=>{
    let release;uploadGate=new Promise(resolve=>{release=resolve});log.info('start_upload');const pending=log.flush();console.error('error_during_upload');release();uploadGate=null;await pending;await log.flush();expect(batches.flatMap(b=>b.logs).some(x=>x.message.includes('error_during_upload'))).toBe(true)
  })
  it('preserves repeated errors across flushes and isolates different traces',async()=>{
    log.error('repeat');await log.flush();log.error('repeat');await log.flush();expect(batches.flatMap(b=>b.logs).filter(x=>x.message==='repeat')).toHaveLength(2)
    log.withTrace('alpha').error('same');log.withTrace('beta').error('same');await log.flush();expect(new Set(batches.flatMap(b=>b.logs).filter(x=>x.message==='same').map(x=>x.traceId))).toEqual(new Set(['alpha','beta']))
  })
  it('captures and redacts a structured error stack',async()=>{
    log.error('structured_error',{error:{name:'Error',message:'failure',stack:'Error: password=private-stack-secret'}});await log.flush();const row=batches.flatMap(b=>b.logs).find(x=>x.message==='structured_error');expect(row.stack).toContain('Error:');expect(JSON.stringify(row)).not.toContain('private-stack-secret')
  })

})
