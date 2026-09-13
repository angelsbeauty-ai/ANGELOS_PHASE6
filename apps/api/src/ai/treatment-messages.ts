import { AiProviderService } from './ai-provider.service';
import type { AssistantProfile, AssistantRoleRow, AiMessageRow } from './ai.types';
import type { CreateConversationDto } from './dto/create-conversation.dto';
import type { SendAiMessageDto } from './dto/send-ai-message.dto';
import type { UpdateAssistantProfileDto } from './dto/update-assistant-profile.dto';
import type { UpdateAssistantRolesDto } from './dto/update-assistant-roles.dto';
import { SendVoiceMessageDto } from './dto/send-voice-message.dto';

export type SendVoiceResult =
  | { transcript: string; reply: string }
  | { error: string; status: number };

export function sendHippocraticTreatmentMessage(
  _treatmentNote: string,
): string {
  return 'Treatment recorded. A care team member will follow up shortly.';
}

export function createTreatmentFromNote(
  _note: string,
  _clientId: string,
  _userId: string,
): Record<string, unknown> {
  return { note: _note, client_id: _clientId, created_by: _userId };
}
