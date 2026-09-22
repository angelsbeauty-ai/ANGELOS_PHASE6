"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTreatmentFromNote = void 0;
const supabase_1 = require("../config/supabase");
async function createTreatmentFromNote(note, clientId, userId, workspaceId) {
    const supabase = (0, supabase_1.createServiceSupabaseClient)();
    const { data, error } = await supabase
        .from('treatments')
        .insert({
        client_id: clientId,
        workspace_id: workspaceId,
        created_by: userId,
        note,
    })
        .select('id')
        .single();
    if (error)
        return { id: '', error: error.message };
    return { id: data.id, error: undefined };
}
exports.createTreatmentFromNote = createTreatmentFromNote;
//# sourceMappingURL=create-treatment-from-note.js.map