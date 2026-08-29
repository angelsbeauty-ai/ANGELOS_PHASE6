import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user';
import { createServiceSupabaseClient, createUserSupabaseClient } from '../config/supabase';
import type { CreateMediaUploadDto } from './dto/create-media-upload.dto';
import type { UpdateMediaAssetDto } from './dto/update-media-asset.dto';

const MEDIA_BUCKET = 'angelos-media';

@Injectable()
export class MediaService {
  async list(user: AuthUser, workspaceId: string, filters: { clientId?: string; contentStatus?: string }) {
    const supabase = createUserSupabaseClient(user.accessToken);
    let query = supabase
      .from('media_assets')
      .select('*,links:media_asset_links(id,client_id,appointment_id,treatment_record_id,role,client:clients(id,display_name))')
      .eq('workspace_id', workspaceId)
      .neq('lifecycle_status', 'deleted')
      .order('captured_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (filters.contentStatus) query = query.eq('content_status', filters.contentStatus);
    const { data, error } = await query.limit(200);
    if (error) throw new InternalServerErrorException(error.message);
    const assets = data ?? [];
    if (!filters.clientId) return assets;
    return assets.filter((asset: any) => asset.links?.some((link: any) => link.client_id === filters.clientId));
  }

  async createUpload(user: AuthUser, workspaceId: string, dto: CreateMediaUploadDto) {
    const mediaType = inferMediaType(dto.mimeType);
    if (!mediaType) throw new BadRequestException('Unsupported media type');
    const safeFilename = sanitizeFilename(dto.filename);
    const assetId = randomUUID();
    const storagePath = `${workspaceId}/${assetId}/${safeFilename}`;
    const supabase = createUserSupabaseClient(user.accessToken);

    if (dto.clientId) {
      const { data: client } = await supabase.from('clients').select('id').eq('workspace_id', workspaceId).eq('id', dto.clientId).maybeSingle();
      if (!client) throw new BadRequestException('Client does not belong to this workspace');
    }

    const { data: asset, error: assetError } = await supabase.from('media_assets').insert({
      id: assetId,
      workspace_id: workspaceId,
      storage_bucket: MEDIA_BUCKET,
      storage_path: storagePath,
      original_filename: dto.filename.trim(),
      mime_type: dto.mimeType,
      media_type: mediaType,
      size_bytes: dto.sizeBytes ?? null,
      width: dto.width ?? null,
      height: dto.height ?? null,
      duration_ms: dto.durationMs ?? null,
      source: dto.source ?? 'phone_photos',
      captured_at: dto.capturedAt ?? null,
      upload_status: 'pending',
      marketing_permission: dto.marketingPermission ?? 'unknown',
      marketing_scope: dto.marketingScope ?? {},
      created_by: user.id
    }).select('*').single();
    if (assetError || !asset) throw new InternalServerErrorException(assetError?.message ?? 'Could not reserve media asset');

    if (dto.clientId || dto.appointmentId || dto.treatmentRecordId) {
      const { error: linkError } = await supabase.from('media_asset_links').insert({
        workspace_id: workspaceId,
        media_asset_id: assetId,
        client_id: dto.clientId ?? null,
        appointment_id: dto.appointmentId ?? null,
        treatment_record_id: dto.treatmentRecordId ?? null,
        role: dto.role ?? 'other',
        created_by: user.id
      });
      if (linkError) throw new InternalServerErrorException(linkError.message);
    }

    const service = createServiceSupabaseClient();
    const { data: signed, error: signedError } = await service.storage.from(MEDIA_BUCKET).createSignedUploadUrl(storagePath);
    if (signedError || !signed) {
      await service.from('media_assets').update({ upload_status: 'failed' }).eq('id', assetId);
      throw new InternalServerErrorException(signedError?.message ?? 'Could not create secure upload URL');
    }

    return {
      asset,
      upload: { bucket: MEDIA_BUCKET, path: storagePath, token: signed.token }
    };
  }

  async finalizeUpload(user: AuthUser, workspaceId: string, assetId: string) {
    const asset = await this.getAsset(user, workspaceId, assetId);
    const service = createServiceSupabaseClient();
    const slash = asset.storage_path.lastIndexOf('/');
    const folder = asset.storage_path.slice(0, slash);
    const filename = asset.storage_path.slice(slash + 1);
    const { data: objects, error } = await service.storage.from(MEDIA_BUCKET).list(folder, { search: filename, limit: 10 });
    if (error) throw new InternalServerErrorException(error.message);
    const object = objects?.find((item: { name: string }) => item.name === filename);
    if (!object) throw new BadRequestException('Upload could not be verified. The business copy is not stored yet.');

    const size = typeof object.metadata?.size === 'number' ? object.metadata.size : asset.size_bytes;
    const { data: updated, error: updateError } = await service.from('media_assets').update({
      upload_status: 'uploaded',
      size_bytes: size ?? null,
      updated_at: new Date().toISOString(),
      metadata: { ...(asset.metadata ?? {}), storage_verified_at: new Date().toISOString() }
    }).eq('workspace_id', workspaceId).eq('id', assetId).select('*').single();
    if (updateError || !updated) throw new InternalServerErrorException(updateError?.message ?? 'Could not finalize media asset');
    return { asset: updated, verified: true };
  }

  async createViewUrl(user: AuthUser, workspaceId: string, assetId: string) {
    const asset = await this.getAsset(user, workspaceId, assetId);
    if (asset.upload_status !== 'uploaded') throw new BadRequestException('Media is not available yet');
    const service = createServiceSupabaseClient();
    const { data, error } = await service.storage.from(MEDIA_BUCKET).createSignedUrl(asset.storage_path, 900);
    if (error || !data) throw new InternalServerErrorException(error?.message ?? 'Could not create media URL');
    return { url: data.signedUrl, expiresInSeconds: 900 };
  }

  async createExportUrl(user: AuthUser, workspaceId: string, assetId: string) {
    const asset = await this.getAsset(user, workspaceId, assetId);
    if (asset.upload_status !== 'uploaded') throw new BadRequestException('Media is not available yet');
    const service = createServiceSupabaseClient();
    const { data, error } = await service.storage.from(MEDIA_BUCKET).createSignedUrl(asset.storage_path, 300, { download: asset.original_filename });
    if (error || !data) throw new InternalServerErrorException(error?.message ?? 'Could not create export URL');
    await service.from('media_usage_events').insert({ workspace_id: workspaceId, media_asset_id: assetId, usage_type: 'exported', created_by: user.id });
    return { url: data.signedUrl, filename: asset.original_filename, expiresInSeconds: 300 };
  }

  async update(user: AuthUser, workspaceId: string, assetId: string, dto: UpdateMediaAssetDto) {
    await this.getAsset(user, workspaceId, assetId);
    const supabase = createUserSupabaseClient(user.accessToken);
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (dto.marketingPermission !== undefined) updates.marketing_permission = dto.marketingPermission;
    if (dto.marketingScope !== undefined) updates.marketing_scope = dto.marketingScope;
    if (dto.contentStatus !== undefined) updates.content_status = dto.contentStatus;
    if (dto.lifecycleStatus !== undefined) updates.lifecycle_status = dto.lifecycleStatus;
    const { data, error } = await supabase.from('media_assets').update(updates).eq('workspace_id', workspaceId).eq('id', assetId).select('*').single();
    if (error || !data) throw new NotFoundException('Media asset not found');
    return data;
  }

  private async getAsset(user: AuthUser, workspaceId: string, assetId: string) {
    const supabase = createUserSupabaseClient(user.accessToken);
    const { data, error } = await supabase.from('media_assets').select('*').eq('workspace_id', workspaceId).eq('id', assetId).single();
    if (error || !data) throw new NotFoundException('Media asset not found');
    return data as any;
  }
}

function inferMediaType(mimeType: string) {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType === 'application/pdf') return 'document';
  return null;
}

function sanitizeFilename(filename: string) {
  const cleaned = filename.trim().replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/^\.+/, '');
  return cleaned.slice(-180) || `media_${Date.now()}`;
}
