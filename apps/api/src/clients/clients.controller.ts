import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { CreateClientNoteDto } from './dto/create-note.dto';
import { CreateTreatmentDto } from './dto/create-treatment.dto';
import { CreateConsentDto } from './dto/create-consent.dto';
import { CreateFollowupDto } from './dto/create-followup.dto';
import { AutomationsService } from '../automations/automations.service';

@Controller('workspaces/:workspaceId/clients')
@UseGuards(SupabaseAuthGuard)
export class ClientsController {
  constructor(private readonly clients: ClientsService, private readonly automations: AutomationsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string, @Query('search') search?: string) {
    return this.clients.list(user, workspaceId, search);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string, @Body() dto: CreateClientDto) {
    return this.clients.create(user, workspaceId, dto);
  }

  @Get(':clientId')
  get(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string, @Param('clientId') clientId: string) {
    return this.clients.get(user, workspaceId, clientId);
  }

  @Patch(':clientId')
  update(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string, @Param('clientId') clientId: string, @Body() dto: UpdateClientDto) {
    return this.clients.update(user, workspaceId, clientId, dto);
  }

  @Post(':clientId/notes')
  addNote(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string, @Param('clientId') clientId: string, @Body() dto: CreateClientNoteDto) {
    return this.clients.addNote(user, workspaceId, clientId, dto);
  }

  @Post(':clientId/treatments')
  addTreatment(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string, @Param('clientId') clientId: string, @Body() dto: CreateTreatmentDto) {
    return this.clients.addTreatment(user, workspaceId, clientId, dto);
  }

  @Post(':clientId/consents')
  addConsent(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string, @Param('clientId') clientId: string, @Body() dto: CreateConsentDto) {
    return this.clients.addConsent(user, workspaceId, clientId, dto);
  }

  @Post(':clientId/followups')
  addFollowup(@CurrentUser() user: AuthUser, @Param('workspaceId') workspaceId: string, @Param('clientId') clientId: string, @Body() dto: CreateFollowupDto) {
    return this.clients.addFollowup(user, workspaceId, clientId, dto);
  }
}
