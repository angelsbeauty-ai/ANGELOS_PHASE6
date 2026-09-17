/// <reference types="node" />
/// <reference types="node" />
import type { Request, Response } from 'express';
import { MessagingService } from './messaging.service';
export declare class MetaWebhookController {
    private readonly messaging;
    constructor(messaging: MessagingService);
    verify(mode: string, token: string, challenge: string, res: Response): Response<any, Record<string, any>>;
    receive(req: Request & {
        rawBody?: Buffer;
    }, signature: string | undefined, body: any, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    private process;
    private verifySignature;
    private findChannel;
}
