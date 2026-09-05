import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import pg from 'pg';

export const require = createRequire(import.meta.url);
export const root = path.resolve(import.meta.dirname, '../..');
export const owner = '10000000-0000-4000-a000-000000000001';
export const outsider = '10000000-0000-4000-a000-000000000002';
export const workspace = '20000000-0000-4000-a000-000000000001';
export const otherWorkspace = '20000000-0000-4000-a000-000000000002';
export const clientId = '30000000-0000-4000-a000-000000000001';
export const channelId = '40000000-0000-4000-a000-000000000001';

const loopback = new Set(['127.0.0.1', 'localhost', '::1']);
const originalConnect = net.Socket.prototype.connect;
net.Socket.prototype.connect = function (...args) {
  const first = Array.isArray(args[0]) ? args[0][0] : args[0];
  const host = typeof first === 'object' ? first.host : typeof args[1] === 'string' ? args[1] : 'localhost';
  if (!loopback.has(host ?? 'localhost')) throw new Error('Synthetic test blocked a non-loopback connection');
  return originalConnect.apply(this, args);
};
const originalFetch = global.fetch;
global.fetch = (input, options) => {
  const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
  if (!loopback.has(url.hostname)) throw new Error('Synthetic test blocked an external HTTP request');
  return originalFetch(input, options);
};
for (const key of Object.keys(process.env)) if (/SUPABASE|OPENAI|N8N|LINE_|META_|DATABASE_URL|^PG/.test(key)) delete process.env[key];
process.env.NODE_ENV = 'staging';
process.env.FLOW1_STAGING_EXECUTION_ENABLED = 'true';
process.env.FLOW1_STAGING_WORKSPACE_ID = workspace;

function command(exe, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(exe, args, { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    child.stdout.on('data', data => { output += data; });
    child.stderr.on('data', data => { output += data; });
    child.on('error', reject);
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(`Local PostgreSQL command failed (${code}): ${output.slice(-1500)}`)));
  });
}
function identifier(value) {
  if (!/^[a-z_][a-z0-9_]*$/.test(value)) throw new Error('Invalid SQL identifier in test facade');
  return `"${value}"`;
}

export async function startHarness() {
  const platform = process.platform === 'win32' ? 'windows' : process.platform;
  const binaries = await import(`@embedded-postgres/${platform}-${process.arch}`);
  const tempRoot = await fs.realpath(os.tmpdir());
  const dataDir = await fs.mkdtemp(path.join(tempRoot, 'angelos-flow1-'));
  const reservation = net.createServer();
  await new Promise(resolve => reservation.listen(0, '127.0.0.1', resolve));
  const port = reservation.address().port;
  await new Promise(resolve => reservation.close(resolve));
  let pool, app, started = false;
  async function close() {
    if (app) await app.close();
    if (pool) await pool.end();
    if (started) await command(binaries.pg_ctl, ['-D', dataDir, '-m', 'fast', '-w', 'stop']);
    const resolved = await fs.realpath(dataDir);
    if (path.dirname(resolved) !== tempRoot || !path.basename(resolved).startsWith('angelos-flow1-')) throw new Error('Unsafe synthetic cleanup path');
    await fs.rm(resolved, { recursive: true, force: true });
  }
  try {
    await command(binaries.initdb, ['-D', dataDir, '-U', 'flow1_test', '--auth=trust', '--encoding=UTF8', '--no-locale']);
    await command(binaries.pg_ctl, ['-D', dataDir, '-l', path.join(dataDir, 'server.log'), '-o', `-h 127.0.0.1 -p ${port} -c max_connections=50`, '-w', 'start']);
    started = true;
    pool = new pg.Pool({ host: '127.0.0.1', port, user: 'flow1_test', database: 'postgres', max: 24 });
    await pool.query(`
      create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth;
      create table auth.users(id uuid primary key, email text);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema public,auth to anon,authenticated,service_role;
      grant execute on function auth.uid() to anon,authenticated,service_role;
    `);
    const migrations = ['0001_foundation.sql','0003_crm.sql','0005_unified_messaging.sql','0010_needs_attention_system_health.sql','20260905181853_approvals_schema.sql','20260905181901_staging_flow1_execution.sql'];
    for (const file of migrations) await pool.query(await fs.readFile(path.join(root, 'supabase/migrations', file), 'utf8'));
    // Deliberately NO uniqueness constraint: duplicate adapter calls must be observable.
    await pool.query('create table flow1_test_provider_calls(id bigint generated always as identity primary key,idempotency_key text not null,body text not null)');
    // Supabase's standard table grants; the new migration's approval grants stay restrictive.
    await pool.query(`grant all on all tables in schema public to service_role;
      grant select on all tables in schema public to authenticated;
      grant insert,update,delete on public.clients,public.messaging_channels,public.message_threads,public.client_channel_identities,public.client_messages,public.message_internal_notes to authenticated;
      alter function public.is_workspace_member(uuid) security invoker;`);
    await pool.query('insert into auth.users(id) values($1),($2)', [owner, outsider]);
    await pool.query("insert into workspaces(id,name,timezone,currency,locale) values($1,'Synthetic owner','UTC','JPY','en'),($2,'Synthetic outsider','UTC','JPY','en')", [workspace, otherWorkspace]);
    await pool.query("insert into workspace_memberships(workspace_id,user_id) values($1,$2),($3,$4)", [workspace, owner, otherWorkspace, outsider]);
    await pool.query('update workspace_operational_controls set flow1_staging_enabled=true where workspace_id=$1', [workspace]);
    await pool.query("insert into clients(id,workspace_id,display_name,created_by) values($1,$2,'Synthetic client',$3)", [clientId, workspace, owner]);
    await pool.query("insert into messaging_channels(id,workspace_id,provider,display_name,status,capabilities,created_by) values($1,$2,'manual','Synthetic Flow 1','connected','{\"demo\":true,\"flow1_test\":true}',$3)", [channelId, workspace, owner]);

    async function queryAs(role, actor, sql, params = []) {
      const connection = await pool.connect();
      try {
        await connection.query('begin');
        await connection.query(`set local role ${identifier(role)}`);
        await connection.query("select set_config('request.jwt.claim.sub',$1,true)", [actor ?? '']);
        const result = await connection.query(sql, params);
        await connection.query('commit');
        return result;
      } catch (error) { await connection.query('rollback'); throw error; }
      finally { connection.release(); }
    }

    let failFinish = false;
    function databaseClient(role, actor) {
      return {
        async rpc(name, args) {
          if (!/^flow1_[a-z_]+$/.test(name)) throw new Error('Unexpected RPC');
          if (failFinish && name === 'flow1_finish_execution') { failFinish=false; return { data:null,error:{code:'XX000',message:'Synthetic recorder failure'} }; }
          try {
            const entries = Object.entries(args);
            const result = await queryAs(role, actor, `select public.${identifier(name)}(${entries.map(([key], i) => `${identifier(key)} => $${i+1}`).join(',')}) as value`, entries.map(([,value]) => value));
            return { data:result.rows[0].value,error:null };
          } catch (error) { return { data:null,error:{code:error.code,message:error.message} }; }
        },
        from(table) {
          if (!['workspace_memberships','workspaces','clients','messaging_channels','client_channel_identities','message_threads','client_messages','message_internal_notes','approvals','approval_history'].includes(table)) throw new Error(`Unexpected table: ${table}`);
          let action='select', payload, select='*', filters=[], order, limit, single=false, required=false, conflict;
          const q = {
            select(value='*') { select=value; return q; },
            eq(key,value) { filters.push([key,'=',value]); return q; },
            neq(key,value) { filters.push([key,'<>',value]); return q; },
            order(key,options={}) { order=[key,options.ascending!==false]; return q; },
            limit(value) { limit=Number(value); return q; },
            single() { single=true; required=true; return q; }, maybeSingle() { single=true; return q; },
            insert(value) { action='insert';payload=value;return q; },
            update(value) { action='update';payload=value;return q; },
            upsert(value,options) { action='insert';payload=value;conflict=options.onConflict;return q; },
            then(resolve,reject) { return (async () => {
              const args=[]; const bind=value => {args.push(value);return `$${args.length}`;};
              const where=()=>filters.length?' where '+filters.map(([key,op,value])=>`${identifier(key)} ${op} ${bind(value)}`).join(' and '):'';
              let sql;
              if(action==='select') {
                let projection='to_jsonb(t)';
                if(table==='message_threads' && select.includes('channel:')) projection+=` || jsonb_build_object('channel',(select to_jsonb(c) from messaging_channels c where c.id=t.channel_id),'client',(select to_jsonb(c) from clients c where c.id=t.client_id))`;
                if(table==='client_messages' && select.includes('thread:')) projection+=` || jsonb_build_object('thread',(select to_jsonb(th) || jsonb_build_object('channel',(select to_jsonb(c) from messaging_channels c where c.id=th.channel_id),'client',(select to_jsonb(c) from clients c where c.id=th.client_id)) from message_threads th where th.id=t.thread_id))`;
                sql=`select ${projection} as row from ${identifier(table)} t${where()}`;
                if(order) sql+=` order by ${identifier(order[0])} ${order[1]?'asc':'desc'}`;
                if(limit!==undefined) sql+=` limit ${bind(limit)}`;
              } else {
                const entries=Object.entries(payload).filter(([,v])=>v!==undefined);
                if(action==='insert') {
                  sql=`insert into ${identifier(table)}(${entries.map(([k])=>identifier(k)).join(',')}) values(${entries.map(([,v])=>bind(v)).join(',')})`;
                  if(conflict) sql+=` on conflict(${conflict.split(',').map(identifier).join(',')}) do update set ${entries.map(([k])=>`${identifier(k)}=excluded.${identifier(k)}`).join(',')}`;
                } else sql=`update ${identifier(table)} set ${entries.map(([k,v])=>`${identifier(k)}=${bind(v)}`).join(',')}${where()}`;
                sql+=` returning to_jsonb(${identifier(table)}) as row`;
              }
              try {
                const result=await queryAs(role,actor,sql,args); const rows=result.rows.map(r=>r.row);
                if(required && rows.length!==1) return {data:null,error:{code:'PGRST116',message:'Expected one row'}};
                return {data:single?rows[0]??null:rows,error:null};
              } catch(error) {return {data:null,error:{code:error.code,message:error.message}};}
            })().then(resolve,reject); }
          }; return q;
        }
      };
    }
    const config=require(path.join(root,'apps/api/dist/config/supabase'));
    config.createServiceSupabaseClient=()=>databaseClient('service_role',owner);
    config.createUserSupabaseClient=token=>databaseClient('authenticated',token.replace('synthetic:',''));
    const apiRequire=createRequire(path.join(root,'apps/api/package.json'));
    const { NestFactory }=apiRequire('@nestjs/core');
    const { Module }=apiRequire('@nestjs/common');
    const { ApprovalsModule }=require(path.join(root,'apps/api/dist/approvals/approvals.module'));
    const { MessagingModule }=require(path.join(root,'apps/api/dist/messaging/messaging.module'));
    const { SupabaseAuthGuard }=require(path.join(root,'apps/api/dist/common/guards/supabase-auth.guard'));
    const { AiProviderService }=require(path.join(root,'apps/api/dist/ai/ai-provider.service'));
    const { StagingMessageExecutionService }=require(path.join(root,'apps/api/dist/messaging/staging-message-execution.service'));
    const { ManualDemoMessagingAdapter }=require(path.join(root,'apps/api/dist/messaging/provider-adapter'));
    // Test-only auth identities and AI draft; use the application's own Nest runtime.
    SupabaseAuthGuard.prototype.canActivate=function(context){const request=context.switchToHttp().getRequest(); const token=String(request.headers.authorization??'').replace('Bearer ',''); const id=token.replace('synthetic:',''); if(![owner,outsider].includes(id)) return false; request.user={id,accessToken:token};return true;};
    AiProviderService.prototype.generate=async()=>({text:'Synthetic approved reply',provider:'synthetic',model:'fixture'});
    class Flow1TestModule {}
    Module({imports:[ApprovalsModule,MessagingModule]})(Flow1TestModule);
    app=await NestFactory.create(Flow1TestModule,{logger:false});
    await app.listen(0,'127.0.0.1');
    const base=await app.getUrl();
    const execution=app.get(StagingMessageExecutionService);
    const manual=new ManualDemoMessagingAdapter();
    const sends=[]; let outcome='sent';
    execution.manualAdapter={async send(input){sends.push(structuredClone(input)); await new Promise(resolve=>setTimeout(resolve,15)); if(outcome==='throw')throw new Error('Synthetic transport timeout'); if(outcome==='failed')return {status:'failed',error:'Synthetic provider rejection'}; return manual.send(input);}};
    async function http(route,body,actor=owner) {
      const response=await fetch(base+route,{method:body===undefined?'GET':'POST',headers:{authorization:`Bearer synthetic:${actor}`,'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
      return {status:response.status,body:await response.json()};
    }
    function worker(approvalId) {
      return new Promise((resolve,reject)=>{
        const child=spawn(process.execPath,[path.join(import.meta.dirname,'worker.mjs'),String(port),approvalId],{windowsHide:true,stdio:['ignore','pipe','pipe']});
        let stdout='',stderr='';child.stdout.on('data',data=>{stdout+=data;});child.stderr.on('data',data=>{stderr+=data;});
        child.on('error',reject);child.on('exit',code=>code===0?resolve(JSON.parse(stdout)):reject(new Error(`Synthetic worker failed: ${stderr}`)));
      });
    }
    return {pool,queryAs,databaseClient,http,execution,sends,worker,close,setOutcome:value=>{outcome=value;},failNextFinish:()=>{failFinish=true;},uuid:randomUUID};
  } catch(error) { await close(); throw error; }
}
