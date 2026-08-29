export type WorkspaceRole = 'owner';

export interface WorkspaceSummary {
  id: string;
  name: string;
  businessType?: string | null;
  timezone: string;
  currency: string;
  locale: string;
}

export interface ApiHealth {
  status: 'healthy' | 'degraded';
  service: 'angelos-api';
  timestamp: string;
}
