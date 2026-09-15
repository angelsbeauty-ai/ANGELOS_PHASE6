import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { AccessToken, type VideoGrant } from 'livekit-server-sdk';
import { randomUUID } from 'node:crypto';
import { CreateVoiceSessionDto } from './dto/create-voice-session.dto';

const DEFAULT_TTL_SECONDS = 15 * 60;

@Injectable()
export class VoiceService {
  createSession(input: CreateVoiceSessionDto) {
    const url = process.env.LIVEKIT_URL?.trim();
    const apiKey = process.env.LIVEKIT_API_KEY?.trim();
    const apiSecret = process.env.LIVEKIT_API_SECRET?.trim();

    if (!url || !apiKey || !apiSecret) {
      throw new ServiceUnavailableException(
        'Live voice is not configured yet. Add LiveKit values to the server environment.',
      );
    }

    const ttlFromEnvironment = Number(process.env.LIVEKIT_TOKEN_TTL_SECONDS);
    const ttl = Number.isFinite(ttlFromEnvironment)
      ? Math.min(Math.max(ttlFromEnvironment, 60), 3600)
      : DEFAULT_TTL_SECONDS;

    const participantIdentity = input.userId?.trim()
      ? `customer-${input.userId.trim()}`
      : `guest-${randomUUID()}`;
    const roomName = `angelos-voice-${randomUUID()}`;
    const grant: VideoGrant = {
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    };

    const token = new AccessToken(apiKey, apiSecret, {
      identity: participantIdentity,
      name: input.displayName?.trim() || 'AngelOs guest',
      ttl,
      metadata: JSON.stringify({ language: input.language || 'auto', product: 'angelos' }),
    });
    token.addGrant(grant);

    return {
      serverUrl: url,
      token: token.toJwt(),
      roomName,
      participantIdentity,
      expiresInSeconds: ttl,
      language: input.language || 'auto',
    };
  }
}
