import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { startHarness, owner, outsider, workspace, otherWorkspace, clientId, channelId } from './harness.mjs';

let h;
before(async()=>{h=await startHarness();},{timeout:120000});
after(async()=>{if(h)await h.close();});
async function flow() {
  const key=h.uuid();
  const inbound=await h.http(`/workspaces/${workspace}/messaging/ingest-demo`,{channelId,clientId,externalUserId:`synthetic:${key}`,externalThreadId:`synthetic:${key}`,externalMessageId:`synthetic-in:${key}`,body:'Synthetic inbound booking inquiry'});
  assert.equal(inbound.status,201,JSON.stringify(inbound.body));
  const draft=await h.http(`/workspaces/${workspace}/messaging/threads/${inbound.body.threadId}/ai-draft`,{});
  assert.equal(draft.status,201,JSON.stringify(draft.body));
  assert.ok(draft.body.approval?.id);
  return {approval:draft.body.approval,message:draft.body.message,inbound:inbound.body};
}
const decide=id=>h.http('/approvals/decide',{approvalId:id,decision:'approved',workspaceId:workspace});
const execute=id=>h.http(`/approvals/${id}/execute`,{workspaceId:workspace});
async function evidence(messageId) {
  return (await h.pool.query('select m.status,m.external_message_id,a.status as attempt_status,a.finished_at,a.idempotency_key from client_messages m left join message_send_attempts a on a.message_id=m.id where m.id=$1',[messageId])).rows[0];
}

test('Flow 1 HTTP E2E: inbound, approval queue, approve, one outbound and recorded result',async()=>{
  const item=await flow(); const before=h.sends.length;
  const pending=await h.http(`/approvals/pending?workspaceId=${workspace}`);
  assert.ok(pending.body.some(row=>row.id===item.approval.id));
  const result=await decide(item.approval.id);
  assert.equal(result.status,201,JSON.stringify(result.body));
  assert.equal(result.body.delivery.status,'sent');
  assert.equal(h.sends.length-before,1);
  const saved=await evidence(item.message.id);
  assert.equal(saved.status,'sent'); assert.equal(saved.attempt_status,'sent'); assert.ok(saved.finished_at);
  assert.equal(saved.external_message_id,`demo_message:${item.message.id}`);
  assert.equal(h.sends.at(-1).externalThreadId,item.inbound.message.metadata ? (await h.pool.query('select external_thread_id from message_threads where id=$1',[item.inbound.threadId])).rows[0].external_thread_id : 'missing');
  const retry=await decide(item.approval.id); assert.equal(retry.status,201); assert.equal(retry.body.delivery.duplicatePrevented,true);
  assert.equal(h.sends.length-before,1);
});
test('24 duplicate approval taps over separate PostgreSQL connections execute once',async()=>{
  const item=await flow();const before=h.sends.length;
  const results=await Promise.all(Array.from({length:24},()=>decide(item.approval.id)));
  results.forEach(r=>assert.equal(r.status,201,JSON.stringify(r.body)));
  assert.equal(h.sends.length-before,1);
  assert.equal((await h.pool.query('select count(*)::int n from approval_history where approval_id=$1',[item.approval.id])).rows[0].n,1);
  assert.equal((await h.pool.query('select count(*)::int n from message_send_attempts where message_id=$1',[item.message.id])).rows[0].n,1);
});
test('24 workers racing a committed approval cannot claim the same message twice',async()=>{
  const item=await flow(); const before=h.sends.length;
  const result=await h.databaseClient('service_role',owner).rpc('flow1_decide_approval',{p_workspace:workspace,p_actor:owner,p_approval:item.approval.id,p_decision:'approved',p_notes:null,p_revised:null});
  assert.equal(result.error,null);
  const workers=await Promise.all(Array.from({length:24},()=>execute(item.approval.id)));
  workers.forEach(r=>assert.equal(r.status,201,JSON.stringify(r.body)));
  assert.equal(workers.filter(r=>r.body.duplicatePrevented===false).length,1);
  assert.equal(h.sends.length-before,1);
});
test('duplicate approval creation is transactional and returns the same approval',async()=>{
  const item=await flow();
  const requests=await Promise.all(Array.from({length:8},()=>h.http('/approvals/message',{sourceId:item.inbound.message.id,sourceChannel:'manual',content:item.message.body,clientId,clientName:'Untrusted name',workspaceId:workspace})));
  requests.forEach(r=>{assert.equal(r.status,201,JSON.stringify(r.body));assert.equal(r.body.id,item.approval.id);assert.equal(r.body.client_name,'Synthetic client');});
});
test('concurrent draft-generation retries cannot create independently sendable duplicates',async()=>{
  const item=await flow();
  const drafts=await Promise.all(Array.from({length:8},()=>h.http(`/workspaces/${workspace}/messaging/threads/${item.inbound.threadId}/ai-draft`,{})));
  drafts.forEach(r=>{assert.equal(r.status,201,JSON.stringify(r.body));assert.equal(r.body.message.id,item.message.id);assert.equal(r.body.approval.id,item.approval.id);});
  const count=await h.pool.query("select count(*)::int n from client_messages where thread_id=$1 and direction='outbound'",[item.inbound.threadId]);assert.equal(count.rows[0].n,1);
});
test('unapproved and rejected replies cannot be executed',async()=>{
  const item=await flow();const before=h.sends.length;
  assert.equal((await execute(item.approval.id)).status,409);
  const rejected=await h.http('/approvals/decide',{approvalId:item.approval.id,decision:'rejected',workspaceId:workspace});assert.equal(rejected.status,201);assert.equal(rejected.body.delivery,null);
  assert.equal((await execute(item.approval.id)).status,409);assert.equal(h.sends.length,before);
});
test('approved revision is the exact body executed and a conflicting repeat is rejected',async()=>{
  const item=await flow();const before=h.sends.length;
  const r=await h.http('/approvals/decide',{approvalId:item.approval.id,decision:'approved',revisedContent:'Synthetic revised reply',workspaceId:workspace});
  assert.equal(r.status,201,JSON.stringify(r.body));assert.equal(h.sends.at(-1).body,'Synthetic revised reply');
  assert.equal((await decide(item.approval.id)).status,409);assert.equal(h.sends.length-before,1);
});
test('provider failure is recorded atomically and never automatically replayed',async()=>{
  const item=await flow();const before=h.sends.length;h.setOutcome('failed');
  try {const r=await decide(item.approval.id);assert.equal(r.body.delivery.status,'failed'); await decide(item.approval.id);assert.equal(h.sends.length-before,1); const saved=await evidence(item.message.id);assert.equal(saved.status,'failed');assert.equal(saved.attempt_status,'failed');}
  finally{h.setOutcome('sent');}
});
test('provider timeout is unknown and duplicate workers cannot resend',async()=>{
  const item=await flow();const before=h.sends.length;h.setOutcome('throw');
  try {const r=await decide(item.approval.id);assert.equal(r.body.delivery.status,'unknown');await Promise.all([decide(item.approval.id),execute(item.approval.id)]); assert.equal(h.sends.length-before,1);const saved=await evidence(item.message.id);assert.equal(saved.status,'unknown');assert.equal(saved.attempt_status,'unknown');}
  finally{h.setOutcome('sent');}
});
test('failure after provider success leaves a durable unknown claim, never a second send',async()=>{
  const item=await flow();const before=h.sends.length;h.failNextFinish();
  assert.equal((await decide(item.approval.id)).status,500);
  assert.equal((await execute(item.approval.id)).body.status,'unknown');
  assert.equal(h.sends.length-before,1);const saved=await evidence(item.message.id);assert.equal(saved.status,'unknown');assert.equal(saved.finished_at,null);
});
test('decision and audit roll back together on a database history failure',async()=>{
  const item=await flow();const before=h.sends.length;
  await h.pool.query("create function flow1_test_fail_history() returns trigger language plpgsql as $$ begin raise exception 'synthetic audit failure'; end $$; create trigger flow1_test_fail_history before insert on approval_history for each row execute function flow1_test_fail_history()");
  try {assert.equal((await decide(item.approval.id)).status,500);assert.equal((await h.pool.query('select status from approvals where id=$1',[item.approval.id])).rows[0].status,'pending');assert.equal(h.sends.length,before);}
  finally{await h.pool.query('drop trigger flow1_test_fail_history on approval_history; drop function flow1_test_fail_history()');}
});
test('delivery evidence and message status roll back together on a database write failure',async()=>{
  const item=await flow();const before=h.sends.length;
  await h.pool.query("create function flow1_test_fail_sent() returns trigger language plpgsql as $$ begin if new.status='sent' then raise exception 'synthetic message write failure'; end if; return new; end $$; create trigger flow1_test_fail_sent before update on client_messages for each row execute function flow1_test_fail_sent()");
  try {assert.equal((await decide(item.approval.id)).status,500);const saved=await evidence(item.message.id);assert.equal(saved.status,'unknown');assert.equal(saved.attempt_status,'unknown');assert.equal(saved.finished_at,null);}
  finally{await h.pool.query('drop trigger flow1_test_fail_sent on client_messages; drop function flow1_test_fail_sent()');}
  await execute(item.approval.id);assert.equal(h.sends.length-before,1);
});
test('an authenticated client cannot forge approvals or call privileged claim RPCs',async()=>{
  const item=await flow();
  await assert.rejects(h.queryAs('authenticated',owner,"update approvals set status='approved' where id=$1",[item.approval.id]),e=>e.code==='42501');
  await assert.rejects(h.queryAs('authenticated',owner,'select flow1_claim_execution($1,$2,$3)',[workspace,owner,item.approval.id]),e=>e.code==='42501');
  const hidden=await h.queryAs('authenticated',outsider,'select * from approvals where workspace_id=$1',[workspace]);assert.equal(hidden.rows.length,0);
  const bad=await h.databaseClient('service_role',outsider).rpc('flow1_claim_execution',{p_workspace:workspace,p_actor:outsider,p_approval:item.approval.id});assert.equal(bad.error.code,'42501');
});
test('production and disabled staging flags cannot dispatch',async()=>{
  const item=await flow();const before=h.sends.length;
  try {
    for(const mode of ['production','development','test']) {process.env.NODE_ENV=mode;assert.equal((await decide(item.approval.id)).status,409);}
    process.env.NODE_ENV='staging';process.env.FLOW1_STAGING_EXECUTION_ENABLED='false';
    assert.equal((await decide(item.approval.id)).status,409);assert.equal(h.sends.length,before);
  } finally{process.env.NODE_ENV='staging';process.env.FLOW1_STAGING_EXECUTION_ENABLED='true';}
});
test('live LINE routing and wrong client data fail before provider execution',async()=>{
  const item=await flow();const before=h.sends.length;
  await h.pool.query("update messaging_channels set provider='line' where id=$1",[channelId]);
  try{assert.equal((await decide(item.approval.id)).status,409);assert.equal(h.sends.length,before);}
  finally{await h.pool.query("update messaging_channels set provider='manual' where id=$1",[channelId]);}
  await h.pool.query('update message_threads set client_id=null where id=$1',[item.inbound.threadId]);
  assert.equal((await execute(item.approval.id)).status,409);assert.equal(h.sends.length,before);
});
test('emergency controls block the flat approvals route and the retry route',async()=>{
  const item=await flow();const before=h.sends.length;
  await h.pool.query('update workspace_operational_controls set emergency_read_only=true where workspace_id=$1',[workspace]);
  try{assert.equal((await decide(item.approval.id)).status,409);assert.equal((await execute(item.approval.id)).status,409);assert.equal(h.sends.length,before);}
  finally{await h.pool.query('update workspace_operational_controls set emergency_read_only=false where workspace_id=$1',[workspace]);}
});
test('direct send cannot bypass a synthetic message approval',async()=>{
  const item=await flow();const before=h.sends.length;
  assert.equal((await h.http(`/workspaces/${workspace}/messaging/messages/${item.message.id}/approve-send`,{})).status,409);assert.equal(h.sends.length,before);
});
test('cross-workspace HTTP approval is rejected and external network access is blocked',async()=>{
  const item=await flow();
  const r=await h.http('/approvals/decide',{approvalId:item.approval.id,decision:'approved',workspaceId:workspace},outsider);assert.equal(r.status,403);
  assert.throws(()=>fetch('https://example.invalid'),/blocked an external/);
  const connections=await h.pool.query('select count(distinct pid)::int n from pg_stat_activity where datname=current_database()');assert.ok(connections.rows[0].n>1);
});
test('eight separate worker processes execute one adapter call in total',async()=>{
  const item=await flow();
  const approved=await h.databaseClient('service_role',owner).rpc('flow1_decide_approval',{p_workspace:workspace,p_actor:owner,p_approval:item.approval.id,p_decision:'approved',p_notes:null,p_revised:null});assert.equal(approved.error,null);
  const results=await Promise.all(Array.from({length:8},()=>h.worker(item.approval.id)));
  assert.equal(results.filter(r=>r.duplicatePrevented===false).length,1);
  const calls=await h.pool.query('select count(*)::int n from flow1_test_provider_calls where idempotency_key=$1',[`message:${item.message.id}`]);assert.equal(calls.rows[0].n,1);
  assert.equal((await evidence(item.message.id)).status,'sent');
});
test('worker lost after claim but before provider call cannot be replaced with a second execution',async()=>{
  const item=await flow();const before=h.sends.length;const db=h.databaseClient('service_role',owner);
  await db.rpc('flow1_decide_approval',{p_workspace:workspace,p_actor:owner,p_approval:item.approval.id,p_decision:'approved',p_notes:null,p_revised:null});
  const claim=await db.rpc('flow1_claim_execution',{p_workspace:workspace,p_actor:owner,p_approval:item.approval.id});assert.equal(claim.data.claimed,true);
  const replacement=await h.worker(item.approval.id);assert.equal(replacement.duplicatePrevented,true);assert.equal(replacement.status,'unknown');assert.equal(h.sends.length,before);
  assert.equal((await h.pool.query('select count(*)::int n from flow1_test_provider_calls where idempotency_key=$1',[`message:${item.message.id}`])).rows[0].n,0);
});
