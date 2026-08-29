import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { CreateMediaUploadDto } from './dto/create-media-upload.dto';
import { UpdateMediaAssetDto } from './dto/update-media-asset.dto';
import { MediaService } from './media.service';

@Controller('workspaces/:workspaceId/media')
@UseGuards(SupabaseAuthGuard)
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Param('workspaceId') workspaceId: string,
    @Query('clientId') clientId?: string,
    @Query('contentStatus') contentStatus?: string
  ) {
    return this.media.list(user, workspaceId, { clientId, contentStatus });
  }

  @Post('uploads')
  createUpload(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string, @Body() dto: CreateMediaUploadDto) {
    return this.media.createUpload(user, workspaceId, dto);
  }

  @Post(':assetId/finalize')
  finalize(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string, @Param('assetId') assetId: string) {
    return this.media.finalizeUpload(user, workspaceId, assetId);
  }

  @Get(':assetId/view-url')
  viewUrl(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string, @Param('assetId') assetId: string) {
    return this.media.createViewUrl(user, workspaceId, assetId);
  }

  @Get(':assetId/export-url')
  exportUrl(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string, @Param('assetId') assetId: string) {
    return this.media.createExportUrl(user, workspaceId, assetId);
  }

  @Patch(':assetId')
  update(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string, @Param('assetId') assetId: string, @Body() dto: UpdateMediaAssetDto) {
    return this.media.update(user, workspaceId, assetId, dto);
  }
}
