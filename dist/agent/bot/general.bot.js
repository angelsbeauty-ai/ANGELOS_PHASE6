"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeneralBot = void 0;
const common_1 = require("@nestjs/common");
const supabase_1 = require("../../config/supabase");
let GeneralBot = class GeneralBot {
    botName = 'general';
    subAgent = 'general';
    async execute(taskId, intent, description) {
        const supabase = (0, supabase_1.createServiceSupabaseClient)();
        console.log(`[${this.botName}] Executing task ${taskId}: ${intent} — ${description}`);
        const result = {
            bot: this.botName,
            subAgent: this.subAgent,
            taskId,
            intent,
            description,
            summary: `General bot processed: ${description}`,
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
                'Marketing research and content',
                'Analytics and reporting',
                'General task processing',
                'Social media research',
                'Audience analysis',
            ],
        };
    }
};
exports.GeneralBot = GeneralBot;
exports.GeneralBot = GeneralBot = __decorate([
    (0, common_1.Injectable)()
], GeneralBot);
//# sourceMappingURL=general.bot.js.map