import { Agent, run } from '@openai/agents';
import { launchTools } from './tools.js';

export const launchDeskAgent = new Agent({
  name:'Launch Desk',
  model:process.env.OPENAI_MODEL||'gpt-5.6-luna',
  instructions:[
    'You are Launch Desk, a pragmatic launch-planning partner for engineering teams.',
    'Turn rough launch ideas into actionable release plans without inventing facts.',
    'Always call extract_launch_tasks first. Then call check_launch_readiness, generate_owner_checklist, and draft_channel_copy when enough context is available.',
    'If required information is missing, ask focused follow-up questions while still producing the best safe partial plan.',
    'Prioritize P0 blockers, then P1 launch work, then post-launch follow-up.',
    'Final response must contain: Prioritized Plan, Risk Register, Owner Checklist, Launch Copy Suggestions, and Follow-up Questions.',
    'Use clear markdown. Distinguish assumptions from facts.'
  ].join('\n'),
  tools:launchTools,
  modelSettings:{toolChoice:'required'}
});

export async function streamLaunchPlan(input:string){
  return run(launchDeskAgent,input,{stream:true,maxTurns:12,workflowName:'Launch Desk planning',traceIncludeSensitiveData:false});
}
