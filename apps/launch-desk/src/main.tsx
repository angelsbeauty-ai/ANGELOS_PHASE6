import React from 'react';
import {createRoot} from 'react-dom/client';
import './styles.css';

type EventLine={kind:'progress'|'tool'|'text'|'done'|'error';text:string};
const demo={brief:'We are launching a redesigned checkout with a faster payment flow and new analytics events.',audience:'Existing web customers and the support team',launchDate:'2026-10-15 09:00 JST',constraints:'No downtime; small engineering team; rollback must be possible within 15 minutes.',assets:'Release notes, product screenshots, help-center draft, customer email draft'};

function App(){
 const [form,setForm]=React.useState(demo);const [events,setEvents]=React.useState<EventLine[]>([]);const [busy,setBusy]=React.useState(false);
 const update=(key:keyof typeof form,value:string)=>setForm(c=>({...c,[key]:value}));
 async function planLaunch(){
  setBusy(true);setEvents([{kind:'progress',text:'Connecting to Launch Desk…'}]);
  try{
   const response=await fetch('/api/launch-plan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});
   if(!response.ok||!response.body){const d=await response.json().catch(()=>({error:'Request failed'}));throw new Error(d.error||'Request failed')}
   const reader=response.body.getReader();const decoder=new TextDecoder();let buffer='';
   while(true){
    const {value,done}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true});const chunks=buffer.split('\n\n');buffer=chunks.pop()||'';
    for(const chunk of chunks){
     const eventName=chunk.match(/^event: (.+)$/m)?.[1];const dataLine=chunk.match(/^data: (.+)$/m)?.[1];if(!eventName||!dataLine)continue;const data=JSON.parse(dataLine);
     if(eventName==='text_delta')setEvents(i=>[...i,{kind:'text',text:data.delta}]);
     else if(eventName==='tool_progress')setEvents(i=>[...i,{kind:'tool',text:data.message}]);
     else if(eventName==='progress')setEvents(i=>[...i,{kind:'progress',text:data.message}]);
     else if(eventName==='error')setEvents(i=>[...i,{kind:'error',text:data.error}]);
     else if(eventName==='done')setEvents(i=>[...i,{kind:'done',text:'Plan complete.'}]);
    }
   }
  }catch(error){setEvents(i=>[...i,{kind:'error',text:error instanceof Error?error.message:String(error)}])}finally{setBusy(false)}
 }
 const modelText=events.filter(e=>e.kind==='text').map(e=>e.text).join('');
 return <main className="shell">
  <aside className="sidebar"><div className="brand"><div className="mark">LD</div><div><strong>Launch Desk</strong><span>Release planning workspace</span></div></div>
   <div className="side-card"><span className="eyebrow">WORKFLOW</span><div className="step active"><b>01</b> Brief</div><div className="step"><b>02</b> Readiness</div><div className="step"><b>03</b> Owners</div><div className="step"><b>04</b> Launch copy</div></div>
   <div className="side-note"><span className="dot"/> Agent tracing enabled<small>Server-side only. Sensitive trace payloads are excluded.</small></div>
  </aside>
  <section className="content"><header className="hero"><div><span className="eyebrow">ENGINEERING LAUNCH DESK</span><h1>Turn a rough idea into a release plan.</h1><p>Give Launch Desk the context your team has. It surfaces work, gates, owners, risks, copy, and the questions that still need answers.</p></div><button className="primary" onClick={planLaunch} disabled={busy}>{busy?'Planning…':'Build launch plan'}</button></header>
   <div className="grid"><section className="panel brief-panel"><div className="panel-head"><div><span className="eyebrow">INPUT</span><h2>Launch brief</h2></div><span className="status">Ready</span></div>
    <label>Product brief<textarea value={form.brief} onChange={e=>update('brief',e.target.value)} rows={5}/></label>
    <div className="two"><label>Audience<input value={form.audience} onChange={e=>update('audience',e.target.value)}/></label><label>Launch date<input value={form.launchDate} onChange={e=>update('launchDate',e.target.value)}/></label></div>
    <label>Constraints<textarea value={form.constraints} onChange={e=>update('constraints',e.target.value)} rows={3}/></label><label>Available assets<textarea value={form.assets} onChange={e=>update('assets',e.target.value)} rows={3}/></label>
   </section>
   <section className="panel stream-panel"><div className="panel-head"><div><span className="eyebrow">LIVE RUN</span><h2>Agent activity</h2></div><span className={busy?'pulse':'status'}>{busy?'Streaming':'Idle'}</span></div>
    <div className="activity">{events.length===0&&<div className="empty">Live tool and model events will appear here.</div>}{events.filter(e=>e.kind!=='text').map((e,i)=><div className={'event '+e.kind} key={i}><i/>{e.text}</div>)}</div>
    <div className="output"><span className="eyebrow">MODEL OUTPUT</span><pre>{modelText||'Launch Desk output will stream here as it is generated.'}</pre></div>
   </section></div><footer>Launch Desk uses the OpenAI Agents SDK on the server. The browser never receives your API key.</footer>
  </section></main>;
}
createRoot(document.getElementById('root')!).render(<App/>);
