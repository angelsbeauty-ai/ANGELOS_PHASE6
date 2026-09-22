-- 0015_automation_events_log.sql
-- Event log for the automations engine: records every trigger fired (treatment.recorded,
-- appointment_confirmed, appointment_completed, etc.) so operations are auditable.

CREATE TABLE IF NOT EXISTS automation_events (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  event_type    TEXT NOT NULL,                                    -- e.g. 'treatment_recorded', 'appointment_confirmed'
  client_id      UUID,
  appointment_id UUID,
  trigger_rule_id UUID REFERENCES automation_rules(id) ON DELETE SET NULL,
  payload       JSONB NOT NULL DEFAULT '{}',                     -- snapshot of what triggered the event
  evidence       JSONB,                                          -- what the engine did in response
  status        TEXT NOT NULL DEFAULT 'fired',                  -- 'fired' | 'processed' | 'skipped' | 'failed'
  error_message TEXT,
  created_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS automation_events_workspace
  ON automation_events(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS automation_events_type
  ON automation_events(workspace_id, event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS automation_events_client
  ON automation_events(workspace_id, client_id, created_at DESC);

COMMENT ON TABLE automation_events IS 'Audit log for automations engine events. Every trigger fire is recorded here with the payload that caused it and the engine response.';
