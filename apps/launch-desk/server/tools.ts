import { tool } from '@openai/agents';
import { z } from 'zod';

export const extractLaunchTasks = tool({
  name:'extract_launch_tasks',
  description:'Extract concrete, prioritized engineering and launch tasks from a product brief. Use first for every launch plan.',
  parameters:z.object({brief:z.string(),launchDate:z.string().optional(),constraints:z.string().optional(),assets:z.string().optional()}),
  execute:async ({brief,launchDate,constraints,assets})=>{
    const tasks=[
      {id:'T1',priority:'P0',task:'Confirm launch scope, success metric, and release owner',owner:'PM',reason:'Prevents scope drift and ambiguous accountability.'},
      {id:'T2',priority:'P0',task:'Define release gate and rollback criteria',owner:'Engineering',reason:'Creates an explicit go/no-go boundary.'},
      {id:'T3',priority:'P1',task:'Validate the critical user path in a production-like environment',owner:'QA/Engineering',reason:'Catches launch-blocking regressions.'},
      {id:'T4',priority:'P1',task:'Prepare audience-facing launch assets and channel copy',owner:'Marketing',reason:'Turns the release into a coordinated launch.'},
      {id:'T5',priority:'P1',task:'Set up launch-day monitoring and escalation coverage',owner:'Engineering/Support',reason:'Shortens response time if issues appear.'}
    ];
    if(/api|integration|backend|migration/i.test(brief)) tasks.splice(2,0,{id:'T6',priority:'P0',task:'Run integration and data-migration checks against the launch path',owner:'Engineering',reason:'The brief suggests backend or data risk.'});
    return {launchDate:launchDate||'Not provided',constraints:constraints||'None provided',assets:assets||'None provided',tasks};
  }
});

export const checkLaunchReadiness = tool({
  name:'check_launch_readiness',
  description:'Check launch readiness against a practical release rubric and identify missing gates.',
  parameters:z.object({brief:z.string(),launchDate:z.string().optional(),constraints:z.string().optional()}),
  execute:async ({brief,launchDate,constraints})=>{
    const missing:string[]=[];
    if(!launchDate) missing.push('Confirmed launch date/time and timezone');
    if(!constraints) missing.push('Explicit launch constraints or confirmation that none exist');
    if(!/rollback|roll back|revert/i.test(brief)) missing.push('Rollback or recovery criteria');
    if(!/monitor|observability|alert/i.test(brief)) missing.push('Launch monitoring and alert ownership');
    if(!/qa|test|staging|production/i.test(brief)) missing.push('Production-like validation plan');
    return {status:missing.length===0?'ready_with_monitoring':'needs_attention',score:Math.max(0,100-missing.length*15),missingGates:missing,rubric:['Scope and owner','Validation','Rollback','Monitoring','Comms']};
  }
});

export const generateOwnerChecklist = tool({
  name:'generate_owner_checklist',
  description:'Convert the launch plan into a concise checklist grouped by owner and timing.',
  parameters:z.object({tasks:z.string(),launchDate:z.string().optional()}),
  execute:async ({launchDate})=>({launchDate:launchDate||'TBD',owners:[
    {owner:'PM',items:['Confirm scope and success metric','Confirm go/no-go decision maker']},
    {owner:'Engineering',items:['Complete release gate','Validate rollback path','Confirm monitoring and on-call coverage']},
    {owner:'QA',items:['Run critical-path regression','Record blockers and sign-off']},
    {owner:'Marketing',items:['Finalize channel copy','Confirm asset links and publish timing']},
    {owner:'Support',items:['Prepare FAQ/escalation path','Monitor launch feedback']}
  ]})
});

export const draftChannelCopy = tool({
  name:'draft_channel_copy',
  description:'Draft concise launch copy for engineering, email, and social channels using the supplied product context.',
  parameters:z.object({product:z.string(),audience:z.string(),value:z.string(),launchDate:z.string().optional()}),
  execute:async ({product,audience,value,launchDate})=>({channels:{
    internal:`Launch note: ${product} is ready for ${audience}. Key value: ${value}. Launch: ${launchDate||'TBD'}. Owners should confirm their release gates before go-live.`,
    email:`Introducing ${product}. Built for ${audience}, it helps with ${value}. Available ${launchDate||'soon'}.`,
    social:`Meet ${product} — built for ${audience}. ${value}. Launching ${launchDate||'soon'}.`
  }})
});
export const launchTools=[extractLaunchTasks,checkLaunchReadiness,generateOwnerChecklist,draftChannelCopy];
