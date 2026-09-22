export declare class GeneralBot {
    private readonly botName;
    private readonly subAgent;
    execute(taskId: string, intent: string, description: string): Promise<{
        success: boolean;
        result: any;
        confidence: number;
    }>;
    getBotInfo(): {
        name: string;
        subAgent: string;
        capabilities: string[];
    };
}
