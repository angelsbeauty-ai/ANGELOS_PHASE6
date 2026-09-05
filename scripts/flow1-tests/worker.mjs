import path from 'node:path';
import pg from 'pg';
import { require, root, owner, workspace } from './harness.mjs';

// Separate Node process, independent service instance and PostgreSQL connection.
const port=Number(process.argv[2]);const approvalId=process.argv[3];
if(!Number.isInteger(port)||port<1024||port>65535||!/^[a-f0-9-]{36}$/.test(approvalId))throw new Error('Invalid synthetic worker arguments');
const pool=new pg.Pool({host:'127.0.0.1',port,user:'flow1_test',database:'postgres',max:1});
const config=require(path.join(root,'apps/api/dist/config/supabase'));
config.createServiceSupabaseClient=()=>({async rpc(name,args){
  if(!['flow1_claim_execution','flow1_finish_execution'].includes(name))throw new Error('Unexpected worker RPC');
  const connection=await pool.connect();
  try{
    await connection.query('begin');await connection.query('set local role service_role');
    const entries=Object.entries(args);entries.forEach(([key])=>{if(!/^p_[a-z_]+$/.test(key))throw new Error('Invalid argument name');});
    const result=await connection.query(`select public.${name}(${entries.map(([key],i)=>`${key} => $${i+1}`).join(',')}) as value`,entries.map(([,value])=>value));
    await connection.query('commit');return {data:result.rows[0].value,error:null};
  }catch(error){await connection.query('rollback');return {data:null,error:{code:error.code,message:error.message}};}
  finally{connection.release();}
}});
const {StagingMessageExecutionService}=require(path.join(root,'apps/api/dist/messaging/staging-message-execution.service'));
const {ManualDemoMessagingAdapter}=require(path.join(root,'apps/api/dist/messaging/provider-adapter'));
const service=new StagingMessageExecutionService();const adapter=new ManualDemoMessagingAdapter();
service.manualAdapter={async send(input){
  await pool.query('insert into flow1_test_provider_calls(idempotency_key,body) values($1,$2)',[input.idempotencyKey,input.body]);
  return adapter.send(input);
}};
try{console.log(JSON.stringify(await service.execute({id:owner,accessToken:`synthetic:${owner}`},workspace,approvalId)));}
finally{await pool.end();}
