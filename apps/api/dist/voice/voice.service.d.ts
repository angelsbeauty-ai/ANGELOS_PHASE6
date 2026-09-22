import { CreateVoiceSessionDto } from './dto/create-voice-session.dto';
export declare class VoiceService {
    createSession(input: CreateVoiceSessionDto): {
        serverUrl: string;
        token: Promise<string>;
        roomName: string;
        participantIdentity: string;
        expiresInSeconds: number;
        language: "auto" | "en" | "ja";
    };
}
