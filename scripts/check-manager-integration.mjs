#!/usr/bin/env node
/** Live Manager acceptance + application trace delivery. Requires running app/Manager. */
import process from 'node:process'
const endpoint=(process.env.MANAGER_ENDPOINT??'http://127.0.0.1:3300').replace(/\/+$/,'')
const appOrigin=(process.env.APP_ORIGIN??'http://127.0.0.1:3602').replace(/\/+$/,'')
const appId=process.env.MANAGER_APP_ID??'sukhjotportfolio'
const serverKey=process.env.MANAGER_LOG_KEY??''
const clientKey=process.env.MANAGER_CLIENT_KEY??process.env.NEXT_PUBLIC_MANAGER_CLIENT_KEY??''
const analyticsKey=process.env.MANAGER_ANALYTICS_KEY??process.env.NEXT_PUBLIC_MANAGER_ANALYTICS_KEY??''
const readCookie=process.env.MANAGER_READ_COOKIE??''
const marker=`check_${Date.now().toString(36)}`
let passed=0, skipped=0
const failures=[]
function check(name,condition) { console.log(`${condition?'ok':'FAIL'} ${name}`); if(condition) passed++; else failures.push(name) }
async function post(path,key,body) {
 const response=await fetch(endpoint+path,{method:'POST',headers:{'content-type':'application/json','x-api-key':key,'origin':appOrigin,'user-agent':'Mozilla/5.0 Chrome/145.0.0.0 Safari/537.36'},body:JSON.stringify(path==='/api/ingest/events'&&key===analyticsKey?{...body,key}:body),signal:AbortSignal.timeout(15000)})
 return {status:response.status,body:await response.json()}
}
if(!serverKey||!clientKey||!analyticsKey) { console.error('Set server, client and analytics Manager keys.'); process.exit(2) }
const log={logs:[{level:'info',message:marker}]}
for(const [name,key] of [['server',serverKey],['client',clientKey]]) {
 const result=await post('/api/ingest/logs',key,log)
 check(`${name} key accepts exactly one log`,result.status===200&&result.body.accepted===1&&result.body.rejected===0)
}
const event=await post('/api/ingest/events',analyticsKey,{events:[{type:'pageview',path:'/integration-check'}]})
check('analytics key accepts exactly one event',event.status===200&&event.body.accepted===1&&event.body.rejected===0)
check('analytics key cannot write logs',(await post('/api/ingest/logs',analyticsKey,log)).status===401)
check('server key cannot write events',(await post('/api/ingest/events',serverKey,{events:[{type:'pageview',path:'/'}]})).status===401)
const invalid=await post('/api/ingest/logs','mlk_not_a_real_key',log)
check('unknown keys return generic 401',invalid.status===401&&invalid.body.error==='unauthorized')
const headers={'x-trace-id':marker}
check('missing public project returns 404',(await fetch(appOrigin+'/api/projects/manager-check-missing',{headers})).status===404)
check('public testimonials read returns 200',(await fetch(appOrigin+'/api/testimonials',{headers})).status===200)
if(readCookie) {
 let rows=[]
 for(let attempt=0;attempt<15;attempt++) {
  const response=await fetch(`${endpoint}/api/projects/${encodeURIComponent(appId)}/logs?traceId=${encodeURIComponent(marker)}`,{headers:{cookie:readCookie},signal:AbortSignal.timeout(15000)})
  if(!response.ok) throw new Error(`Manager log reader returned ${response.status}`)
  rows=(await response.json()).logs??[]
  if(rows.some((row)=>row.message==='request_completed')) break
  await new Promise((resolve)=>setTimeout(resolve,200))
 }
 check('application completion persisted under the incoming browser trace',rows.some((row)=>row.message==='request_completed'&&row.source==='server'&&row.traceId===marker))
} else { skipped++; console.log('skip stored-log verification: set MANAGER_READ_COOKIE to an authorized Manager session') }
const degraded=(process.env.APP_ORIGIN_DEGRADED??'').replace(/\/+$/,'')
if(degraded) {
 const response=await fetch(degraded+'/api/testimonials',{ signal:AbortSignal.timeout(10000)})
 check('application still answers with Manager unreachable',response.status===200)
} else { skipped++; console.log('skip outage instance: set APP_ORIGIN_DEGRADED') }
console.log(`${passed} passed, ${skipped} skipped, ${failures.length} failed; marker ${marker}`)
if(failures.length) process.exit(1)
