import { CreateVoiceSessionDto } from './dto/create-voice-session.dto';
import { VoiceService } from './voice.service';
export declare class VoiceController {
    private readonly voiceService;
    constructor(voiceService: VoiceService);
    createSession(input: CreateVoiceSessionDto): {
        serverUrl: string;
        token: Promise<string>;
        roomName: string;
        participantIdentity: string;
        expiresInSeconds: number;
        language: "auto" | "en" | "ja";
    };
}
