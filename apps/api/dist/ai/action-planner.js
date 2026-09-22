"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.planSafeAssistantAction = void 0;
function planSafeAssistantAction(message) {
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
exports.planSafeAssistantAction = planSafeAssistantAction;
//# sourceMappingURL=action-planner.js.map