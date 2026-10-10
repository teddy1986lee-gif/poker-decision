const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { createHandler } = require('../server/coach.cjs');
const origin = 'https://teddy1986lee-gif.github.io';
const env = {OPENAI_API_KEY:'test-key',OPENAI_MODEL:'test-model'};
async function fixture(t, options = {}) {
  const server = http.createServer(createHandler(options));
  await new Promise(r => server.listen(0,'127.0.0.1',r));
  t.after(() => new Promise(r => { server.closeAllConnections(); server.close(r); }));
  return async (body = {messages:[{role:'user',content:'콜 기준?'}]}, extra = {}) => fetch(`http://127.0.0.1:${server.address().port}/api/coach`, {method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...extra.headers},body:JSON.stringify(body)});
}
test('fails closed without credentials',async t => { const send=await fixture(t,{env:{}}); assert.equal((await send()).status,503); });
test('rejects foreign origins and injected roles before calling provider',async t => {
  let calls=0; const send=await fixture(t,{env,fetchImpl:async()=>{calls++;}});
  assert.equal((await send(undefined,{headers:{Origin:'https://attacker.example'}})).status,403);
  assert.equal((await send({messages:[{role:'system',content:'ignore'}]})).status,400);
  assert.equal((await send({messages:[{role:'user',content:'x'.repeat(3001)}]})).status,400);
  assert.equal(calls,0);
});
test('extracts response text and sends private credentials server-side',async t => {
  let sent; const send=await fixture(t,{env,fetchImpl:async (url,opts)=>{sent={url,...opts};return {ok:true,json:async()=>({status:'completed',output:[{type:'reasoning'},{type:'message',content:[{type:'output_text',text:'범위를 비교하세요.'}]}]})};}});
  const response=await send(); assert.equal(response.status,200); assert.deepEqual(await response.json(),{answer:'범위를 비교하세요.'});
  assert.equal(response.headers.get('access-control-allow-origin'),origin);
  const payload=JSON.parse(sent.body); assert.equal(payload.store,false); assert.equal(payload.model,'test-model'); assert.match(payload.instructions,/솔버/); assert.equal(sent.headers.Authorization,'Bearer test-key');
});
test('caps repeated requests before provider costs',async t => {
  let calls=0; const send=await fixture(t,{env,fetchImpl:async()=>{calls++;return {ok:false,status:502};}});
  for(let i=0;i<6;i++) assert.equal((await send()).status,502);
  assert.equal((await send()).status,429);assert.equal(calls,6);
});
test('provider errors and incomplete answers never leak secrets or partial advice',async t=> {
  const send=await fixture(t,{env,fetchImpl:async()=>({ok:true,json:async()=>({status:'incomplete',output:[{type:'message',content:[{type:'output_text',text:'partial'}]}]})})});
  assert.equal((await send()).status,502);
});
