import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { ContentService } from './content.service';
import { CreateContentDraftDto } from './dto/create-content-draft.dto';
import { ReviewContentMediaDto } from './dto/review-content-media.dto';
import { ScheduleContentVariantDto } from './dto/schedule-content-variant.dto';
import { UpdateContentVariantDto } from './dto/update-content-variant.dto';

@Controller('workspaces/:workspaceId/content')
@UseGuards(SupabaseAuthGuard)
export class ContentController {
  constructor(private readonly content: ContentService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string) {
    return this.content.list(user, workspaceId);
  }

  @Get(':contentPostId')
  get(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string, @Param('contentPostId') contentPostId: string) {
    return this.content.get(user, workspaceId, contentPostId);
  }

  @Post('review-media')
  reviewMedia(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string, @Body() dto: ReviewContentMediaDto) {
    return this.content.reviewMedia(user, workspaceId, dto);
  }

  @Post()
  createDraft(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string, @Body() dto: CreateContentDraftDto) {
    return this.content.createDraft(user, workspaceId, dto);
  }

  @Post(':contentPostId/approve')
  approve(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string, @Param('contentPostId') contentPostId: string) {
    return this.content.approve(user, workspaceId, contentPostId);
  }

  @Patch('variants/:variantId')
  updateVariant(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string, @Param('variantId') variantId: string, @Body() dto: UpdateContentVariantDto) {
    return this.content.updateVariant(user, workspaceId, variantId, dto);
  }

  @Post('variants/:variantId/schedule')
  scheduleVariant(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string, @Param('variantId') variantId: string, @Body() dto: ScheduleContentVariantDto) {
    return this.content.scheduleVariant(user, workspaceId, variantId, dto.scheduledFor);
  }

  @Post('variants/:variantId/publish')
  publishNow(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string, @Param('variantId') variantId: string) {
    return this.content.publishNow(user, workspaceId, variantId);
  }
}
