import { apiFetch } from './api';

export interface VoiceRequest {
  audioBase64: string;
  filename: string;
}

export interface VoiceResponse {
  transcript: string;
  reply: string;
}

export async function sendVoiceToHermes(
  workspaceId: string,
  body: VoiceRequest
): Promise<VoiceResponse> {
  const text = await apiFetch<{ transcript: string }>(
    `/workspaces/${workspaceId}/hermes/voice`,
    { method: 'POST', body: JSON.stringify(body) }
  );
  return { transcript: text.transcript, reply: text.transcript };
}