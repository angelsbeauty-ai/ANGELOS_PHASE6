export type SendVoiceResult = {
    transcript: string;
    reply: string;
} | {
    error: string;
    status: number;
};
export declare function sendHippocraticTreatmentMessage(_treatmentNote: string): string;
export declare function createTreatmentFromNote(_note: string, _clientId: string, _userId: string): Record<string, unknown>;
