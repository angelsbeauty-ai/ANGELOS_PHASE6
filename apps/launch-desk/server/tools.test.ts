import {describe,expect,it} from 'vitest';
import {extractLaunchTasks,checkLaunchReadiness} from './tools';
describe('Launch Desk tools',()=>{
 it('extracts prioritized tasks',async()=>{
  const result=await extractLaunchTasks.execute({brief:'Launch checkout API and analytics',launchDate:'2026-10-15',constraints:'No downtime',assets:'Release notes'});
  expect(result.tasks.some(t=>t.priority==='P0')).toBe(true);
  expect(result.tasks.some(t=>t.task.toLowerCase().includes('integration'))).toBe(true);
 });
 it('flags missing readiness gates',async()=>{
  const result=await checkLaunchReadiness.execute({brief:'Launch a new page'});
  expect(result.status).toBe('needs_attention');expect(result.missingGates.length).toBeGreaterThan(0);
 });
});
