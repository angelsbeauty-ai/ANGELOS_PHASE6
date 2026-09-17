"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceService = void 0;
const common_1 = require("@nestjs/common");
const livekit_server_sdk_1 = require("livekit-server-sdk");
const node_crypto_1 = require("node:crypto");
const DEFAULT_TTL_SECONDS = 15 * 60;
let VoiceService = class VoiceService {
    createSession(input) {
        const url = process.env.LIVEKIT_URL?.trim();
        const apiKey = process.env.LIVEKIT_API_KEY?.trim();
        const apiSecret = process.env.LIVEKIT_API_SECRET?.trim();
        if (!url || !apiKey || !apiSecret) {
            throw new common_1.ServiceUnavailableException('Live voice is not configured yet. Add LiveKit values to the server environment.');
        }
        const ttlFromEnvironment = Number(process.env.LIVEKIT_TOKEN_TTL_SECONDS);
        const ttl = Number.isFinite(ttlFromEnvironment)
            ? Math.min(Math.max(ttlFromEnvironment, 60), 3600)
            : DEFAULT_TTL_SECONDS;
        const participantIdentity = input.userId?.trim()
            ? `customer-${input.userId.trim()}`
            : `guest-${(0, node_crypto_1.randomUUID)()}`;
        const roomName = `angelos-voice-${(0, node_crypto_1.randomUUID)()}`;
        const grant = {
            roomJoin: true,
            room: roomName,
            canPublish: true,
            canSubscribe: true,
            canPublishData: true,
        };
        const token = new livekit_server_sdk_1.AccessToken(apiKey, apiSecret, {
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
};
exports.VoiceService = VoiceService;
exports.VoiceService = VoiceService = __decorate([
    (0, common_1.Injectable)()
], VoiceService);
//# sourceMappingURL=voice.service.js.map