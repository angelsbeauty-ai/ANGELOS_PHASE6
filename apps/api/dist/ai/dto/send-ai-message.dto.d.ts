declare class AiMessageContextDto {
    screen?: string;
    entityType?: string;
    entityId?: string;
}
export declare class SendAiMessageDto {
    message: string;
    context?: AiMessageContextDto;
}
export {};
