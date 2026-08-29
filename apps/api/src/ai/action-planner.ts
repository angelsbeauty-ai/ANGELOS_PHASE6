export type PlannedAction =
  | {
      actionKey: 'update_assistant_name';
      riskLevel: 'low';
      requiresApproval: true;
      input: { displayName: string };
      summary: string;
    }
  | {
      actionKey: 'propose_memory';
      riskLevel: 'medium';
      requiresApproval: true;
      input: { category: 'preference'; content: string };
      summary: string;
    };

// Sprint 2 deliberately supports only narrow, reversible/persistent assistant actions.
// Later modules will register CRM/booking/content tools here behind their own risk rules.
export function planSafeAssistantAction(message: string): PlannedAction | null {
  const renameMatch = message.match(/(?:call yourself|your name is|rename yourself to)\s+["“]?([^"”.,!?\n]{2,40})/i);
  if (renameMatch?.[1]) {
    const displayName = renameMatch[1].trim();
    return {
      actionKey: 'update_assistant_name',
      riskLevel: 'low',
      requiresApproval: true,
      input: { displayName },
      summary: `Change your assistant name to ${displayName}`
    };
  }

  const rememberMatch = message.match(/(?:remember that|remember:)\s+(.{4,240})/i);
  if (rememberMatch?.[1]) {
    const content = rememberMatch[1].trim();
    return {
      actionKey: 'propose_memory',
      riskLevel: 'medium',
      requiresApproval: true,
      input: { category: 'preference', content },
      summary: `Save this as reusable workspace knowledge: “${content}”`
    };
  }

  return null;
}
