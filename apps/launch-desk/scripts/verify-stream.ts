import 'dotenv/config';
const url=process.env.LAUNCH_DESK_URL||'http://localhost:3180/api/launch-plan';
if(!process.env.OPENAI_API_KEY)throw new Error('OPENAI_API_KEY is required for the real E2E verification.');
const response=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({brief:'Launch a new checkout flow with analytics tracking.',audience:'Existing customers and support.',launchDate:'2026-10-15 09:00 JST',constraints:'No downtime. Rollback within 15 minutes.',assets:'Release notes and screenshots.'})});
if(!response.ok||!response.body)throw new Error(`Agent endpoint failed: ${response.status} ${await response.text()}`);
const reader=response.body.getReader();const decoder=new TextDecoder();let buffer='';let sawTool=false;let sawDelta=false;
while(true){const {value,done}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true});const chunks=buffer.split('\n\n');buffer=chunks.pop()||'';for(const chunk of chunks){const event=chunk.match(/^event: (.+)$/m)?.[1];const data=chunk.match(/^data: (.+)$/m)?.[1];if(!event||!data)continue;if(event==='tool_progress')sawTool=true;if(event==='text_delta')sawDelta=true;process.stdout.write(`event=${event} data=${data.slice(0,220)}\n`)}}
if(!sawTool)throw new Error('E2E verification failed: no tool_progress event received.');
if(!sawDelta)throw new Error('E2E verification failed: no text_delta event received.');
console.log('PASS: received at least one tool_progress event and one model text_delta.');
