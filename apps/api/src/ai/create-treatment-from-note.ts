import type { AuthUser } from '../auth/auth-user';
import { createServiceSupabaseClient } from '../config/supabase';

export async function createTreatmentFromNote(
  note: string,
  clientId: string,
  userId: string,
  workspaceId: string,
): Promise<{ id: string; error?: string }> {
  const supabase = createServiceSupabaseClient();
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

  if (error) return { id: '', error: error.message };
  return { id: data.id, error: undefined };
}
