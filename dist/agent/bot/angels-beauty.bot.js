"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AngelsBeautyBot = void 0;
const common_1 = require("@nestjs/common");
const supabase_1 = require("../../config/supabase");
let AngelsBeautyBot = class AngelsBeautyBot {
    botName = 'angels_beauty';
    subAgent = 'angels-beauty-crm';
    async execute(taskId, intent, description) {
        const supabase = (0, supabase_1.createServiceSupabaseClient)();
        console.log(`[${this.botName}] Executing task ${taskId}: ${intent} — ${description}`);
        const result = {
            bot: this.botName,
            subAgent: this.subAgent,
            taskId,
            intent,
            description,
            summary: `Angels Beauty bot processed: ${description}`,
            actionTaken: 'no_action_phase1',
            dataReviewed: [],
            recommendation: 'Ready for your review',
        };
        return { success: true, result, confidence: 90 };
    }
    getBotInfo() {
        return {
            name: this.botName,
            subAgent: this.subAgent,
            capabilities: [
                'Client CRM management',
                'Customer inquiries and follow-ups',
                'Service and booking workflows',
                'Beauty business marketing content',
                'Organic customer growth',
                'Business reports',
            ],
        };
    }
};
exports.AngelsBeautyBot = AngelsBeautyBot;
exports.AngelsBeautyBot = AngelsBeautyBot = __decorate([
    (0, common_1.Injectable)()
], AngelsBeautyBot);
//# sourceMappingURL=angels-beauty.bot.js.map