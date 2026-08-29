import { apiFetch } from './api';

export interface WorkspaceSummary {
  id: string;
  name: string;
  business_type?: string | null;
  timezone: string;
  currency: string;
  locale: string;
}

export async function getActiveWorkspace(): Promise<WorkspaceSummary> {
  const workspaces = await apiFetch<WorkspaceSummary[]>('/workspaces');
  const workspace = workspaces[0];
  if (!workspace) {
    throw new Error('No business workspace found. Create your workspace first.');
  }
  return workspace;
}
