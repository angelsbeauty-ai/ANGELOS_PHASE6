import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { streamLaunchPlan } from './agent.js';

const app=express();
app.use(cors());
app.use(express.json({limit:'1mb'}));
app.get('/api/health',(_req,res)=>res.json({ok:true,service:'launch-desk',model:process.env.OPENAI_MODEL||'gpt-5.6-luna'}));

app.post('/api/launch-plan',async(req,res)=>{
  if(!process.env.OPENAI_API_KEY)return res.status(500).json({error:'OPENAI_API_KEY is not configured on the server.'});
  const {brief,audience,launchDate,constraints,assets}=req.body??{};
  if(!brief||!audience)return res.status(400).json({error:'brief and audience are required.'});
  const prompt=[`Product brief: ${brief}`,`Audience: ${audience}`,`Launch date: ${launchDate||'Missing'}`,`Constraints: ${constraints||'Missing'}`,`Available assets: ${assets||'Missing'}`].join('\n');
  try{
    const stream=await streamLaunchPlan(prompt);
    res.status(200);res.setHeader('Content-Type','text/event-stream; charset=utf-8');res.setHeader('Cache-Control','no-cache, no-transform');res.setHeader('Connection','keep-alive');res.flushHeaders?.();
    const send=(event:string,data:unknown)=>res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    send('progress',{stage:'agent_started',message:'Launch Desk is analyzing the brief.'});
    for await(const event of stream){
      if(event.type==='run_item_stream_event'){
        if(event.name==='tool_called'){
          const item=event.item as {rawItem?:{name?:string};name?:string};
          send('tool_progress',{stage:'called',tool:item.rawItem?.name||item.name||'launch_tool',message:'Launch Desk is checking the release inputs.'});
        }else if(event.name==='tool_output'){
          send('tool_progress',{stage:'completed',message:'Launch Desk completed a planning check.'});
        }
      }
      if(event.type==='raw_model_stream_event'){
        const data=event.data as {type?:string;delta?:string;event?:{type?:string;delta?:string}};
        const type=data.event?.type||data.type;const delta=data.event?.delta??data.delta;
        if((type==='response.output_text.delta'||type==='output_text_delta')&&delta)send('text_delta',{delta});
      }
    }
    await stream.completed;send('done',{ok:true});return res.end();
  }catch(error){
    const message=error instanceof Error?error.message:String(error);
    if(!res.headersSent)return res.status(500).json({error:message});
    send('error',{error:message});return res.end();
  }
});
const port=Number(process.env.PORT||3180);
app.listen(port,'0.0.0.0',()=>console.log(`Launch Desk API listening on http://localhost:${port}`));
