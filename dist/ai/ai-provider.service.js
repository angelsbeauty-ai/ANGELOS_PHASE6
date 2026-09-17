"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiProviderService = void 0;
const common_1 = require("@nestjs/common");
let AiProviderService = class AiProviderService {
    async generate(request) {
        const mode = process.env.AI_PROVIDER_MODE ?? 'mock';
        if (mode !== 'openai') {
            return this.mockResponse(request.input);
        }
        const apiKey = process.env.OPENAI_API_KEY;
        const model = process.env.OPENAI_MODEL ?? 'gpt-5.6-terra';
        if (!apiKey) {
            throw new common_1.BadGatewayException('OPENAI_API_KEY is not configured');
        }
        const response = await fetch('https://api.openai.com/v1/responses', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model,
                instructions: request.instructions,
                input: request.imageUrls?.length
                    ? [{
                            role: 'user',
                            content: [
                                { type: 'input_text', text: request.input },
                                ...request.imageUrls.slice(0, 8).map((imageUrl) => ({ type: 'input_image', image_url: imageUrl, detail: 'auto' }))
                            ]
                        }]
                    : request.input
            })
        });
        if (!response.ok) {
            const body = await response.text();
            throw new common_1.BadGatewayException(`AI provider error (${response.status}): ${body.slice(0, 500)}`);
        }
        const payload = (await response.json());
        const text = extractOutputText(payload);
        if (!text) {
            throw new common_1.BadGatewayException('AI provider returned no text output');
        }
        return { text, provider: 'openai', model };
    }
    mockResponse(input) {
        const normalized = input.toLowerCase();
        let text = 'Tell me what you are trying to get done, even if you are not sure how to phrase it. I’ll help you turn it into the next useful step.';
        if (normalized.includes('marketing_coach')) {
            text = 'I’ll use your own measured results first and treat anything with limited history as a test, not a fact. Your next step should repeat the strongest useful content pattern for your current business goal, then compare inquiries/bookings—not only views. Do you want me to review your unused media and build that next post?';
        }
        else if (normalized.includes('content_draft_json')) {
            text = JSON.stringify({
                strategyReason: 'Use the strongest eligible client result and keep the message focused on one business goal.',
                hook: 'A closer look at this result',
                caption: 'A polished client result with a clear, natural finish. If this is the kind of result you are looking for, send a message and I can help you check the next available appointment.',
                cta: 'Message to check availability.',
                hashtags: ['#beautybusiness', '#beautyartist', '#clientresults'],
                editingInstructions: { crop: 'Use a clean vertical crop when possible.', look: 'Natural, polished, premium.', pacing: 'Remove dead time and keep the strongest result visible early.' }
            });
        }
        else if (normalized.includes('booking') || normalized.includes('client')) {
            text = 'It sounds like the goal involves a client workflow. CRM and booking tools are not connected in Sprint 2 yet, so I won’t pretend I can change them. Tell me the outcome you want, and I can help you plan the safest next step.';
        }
        else if (normalized.includes('post') || normalized.includes('instagram') || normalized.includes('content')) {
            text = 'I can help you think through the content direction. What do you have available right now—short clips, before-and-after photos, or client result pictures?';
        }
        else if (normalized.includes('more bookings') || normalized.includes('more clients')) {
            text = 'Your real goal sounds like more qualified inquiries and bookings, not just more views. What content or client results do you already have available right now?';
        }
        return { text, provider: 'mock', model: 'angelos-dev-mock' };
    }
};
exports.AiProviderService = AiProviderService;
exports.AiProviderService = AiProviderService = __decorate([
    (0, common_1.Injectable)()
], AiProviderService);
function extractOutputText(payload) {
    if (typeof payload?.output_text === 'string' && payload.output_text.trim()) {
        return payload.output_text.trim();
    }
    const parts = [];
    for (const item of payload?.output ?? []) {
        if (item?.type !== 'message')
            continue;
        for (const content of item?.content ?? []) {
            if ((content?.type === 'output_text' || content?.type === 'text') && typeof content?.text === 'string') {
                parts.push(content.text);
            }
        }
    }
    return parts.join('\n').trim();
}
//# sourceMappingURL=ai-provider.service.js.map