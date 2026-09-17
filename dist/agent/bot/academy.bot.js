"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AcademyBot = void 0;
const common_1 = require("@nestjs/common");
const supabase_1 = require("../../config/supabase");
let AcademyBot = class AcademyBot {
    botName = 'academy';
    subAgent = 'academy-students';
    async execute(taskId, intent, description) {
        const supabase = (0, supabase_1.createServiceSupabaseClient)();
        console.log(`[${this.botName}] Executing task ${taskId}: ${intent} — ${description}`);
        const result = {
            bot: this.botName,
            subAgent: this.subAgent,
            taskId,
            intent,
            description,
            summary: `Academy bot processed: ${description}`,
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
                'Student CRM management',
                'Course and lesson workflow support',
                'Academy inquiries and communications',
                'Academy marketing content',
                'Student enrollment tracking',
                'Course-business reports',
            ],
        };
    }
};
exports.AcademyBot = AcademyBot;
exports.AcademyBot = AcademyBot = __decorate([
    (0, common_1.Injectable)()
], AcademyBot);
//# sourceMappingURL=academy.bot.js.map