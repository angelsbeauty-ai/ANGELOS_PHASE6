import type { AiProviderRequest, AiProviderResponse } from './ai.types';
export declare class AiProviderService {
    generate(request: AiProviderRequest): Promise<AiProviderResponse>;
    private mockResponse;
}
