import { apiFetch } from './api';
import { supabase } from './supabase';

export interface MediaAsset {
  id: string;
  workspace_id: string;
  original_filename: string;
  mime_type: string;
  media_type: 'image' | 'video' | 'document';
  size_bytes: number | null;
  width: number | null;
  height: number | null;
  duration_ms: number | null;
  source: string;
  captured_at: string | null;
  upload_status: 'pending' | 'uploaded' | 'failed';
  lifecycle_status: 'active' | 'archived' | 'deleted';
  marketing_permission: 'unknown' | 'private' | 'treatment_only' | 'marketing_approved' | 'limited';
  content_status: 'unused' | 'reviewed' | 'selected' | 'ready' | 'posted' | 'archived';
  created_at: string;
  links?: Array<{ id: string; client_id: string | null; appointment_id: string | null; treatment_record_id: string | null; role: string; client?: { id: string; display_name: string } | null }>;
}

export interface LocalMediaSelection {
  uri: string;
  filename: string;
  mimeType: string;
  sizeBytes?: number;
  width?: number;
  height?: number;
  durationMs?: number;
  source?: 'phone_photos' | 'camera' | 'phone_files';
  capturedAt?: string;
}

export function listMedia(workspaceId: string, filters?: { clientId?: string; contentStatus?: string }) {
  const query = new URLSearchParams();
  if (filters?.clientId) query.set('clientId', filters.clientId);
  if (filters?.contentStatus) query.set('contentStatus', filters.contentStatus);
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return apiFetch<MediaAsset[]>(`/workspaces/${workspaceId}/media${suffix}`);
}

export async function importMedia(workspaceId: string, local: LocalMediaSelection, link?: { clientId?: string; appointmentId?: string; treatmentRecordId?: string; role?: string; marketingPermission?: string }) {
  const reservation = await apiFetch<{ asset: MediaAsset; upload: { bucket: string; path: string; token: string } }>(`/workspaces/${workspaceId}/media/uploads`, {
    method: 'POST',
    body: JSON.stringify({
      filename: local.filename,
      mimeType: local.mimeType,
      sizeBytes: local.sizeBytes,
      width: local.width,
      height: local.height,
      durationMs: local.durationMs,
      source: local.source ?? 'phone_photos',
      capturedAt: local.capturedAt,
      clientId: link?.clientId,
      appointmentId: link?.appointmentId,
      treatmentRecordId: link?.treatmentRecordId,
      role: link?.role ?? 'other',
      marketingPermission: link?.marketingPermission ?? 'unknown'
    })
  });

  const fileResponse = await fetch(local.uri);
  if (!fileResponse.ok) throw new Error('Could not read the selected media from this device.');
  const body = await fileResponse.arrayBuffer();
  const { error } = await supabase.storage.from(reservation.upload.bucket).uploadToSignedUrl(
    reservation.upload.path,
    reservation.upload.token,
    body,
    { contentType: local.mimeType, upsert: false }
  );
  if (error) throw new Error(error.message);

  const finalized = await apiFetch<{ asset: MediaAsset; verified: boolean }>(`/workspaces/${workspaceId}/media/${reservation.asset.id}/finalize`, { method: 'POST' });
  return finalized.asset;
}

export function getMediaViewUrl(workspaceId: string, assetId: string) {
  return apiFetch<{ url: string; expiresInSeconds: number }>(`/workspaces/${workspaceId}/media/${assetId}/view-url`);
}

export function getMediaExportUrl(workspaceId: string, assetId: string) {
  return apiFetch<{ url: string; filename: string; expiresInSeconds: number }>(`/workspaces/${workspaceId}/media/${assetId}/export-url`);
}

export function updateMedia(workspaceId: string, assetId: string, input: Record<string, unknown>) {
  return apiFetch<MediaAsset>(`/workspaces/${workspaceId}/media/${assetId}`, { method: 'PATCH', body: JSON.stringify(input) });
}
