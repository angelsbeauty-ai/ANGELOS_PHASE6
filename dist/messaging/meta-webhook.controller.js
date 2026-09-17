"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetaWebhookController = void 0;
const common_1 = require("@nestjs/common");
const node_crypto_1 = require("node:crypto");
const supabase_1 = require("../config/supabase");
const messaging_service_1 = require("./messaging.service");
const meta_transport_1 = require("./meta-transport");
let MetaWebhookController = class MetaWebhookController {
    messaging;
    constructor(messaging) {
        this.messaging = messaging;
    }
    verify(mode, token, challenge, res) {
        const expected = process.env.META_WEBHOOK_VERIFY_TOKEN;
        if (mode === 'subscribe' && expected && token === expected) {
            return res.status(200).send(challenge);
        }
        return res.status(403).send('Verification failed');
    }
    async receive(req, signature, body, res) {
        try {
            const { appSecret } = await (0, meta_transport_1.loadMetaAppCredentials)();
            if (!this.verifySignature(appSecret, req.rawBody, signature)) {
                return res.status(401).send('Invalid signature');
            }
        }
        catch {
            return res.status(503).send('Meta webhook not configured');
        }
        res.status(200).send('EVENT_RECEIVED');
        await this.process(body).catch(() => {
        });
    }
    async process(body) {
        const object = body?.object;
        if (object !== 'instagram' && object !== 'page')
            return;
        const provider = object === 'instagram' ? 'instagram' : 'facebook';
        for (const entry of body?.entry ?? []) {
            const externalAccountId = String(entry?.id ?? '');
            if (!externalAccountId)
                continue;
            const channel = await this.findChannel(provider, externalAccountId);
            if (!channel)
                continue;
            for (const event of entry?.messaging ?? []) {
                const text = event?.message?.text;
                const senderId = event?.sender?.id;
                const mid = event?.message?.mid;
                if (!text || !senderId || !mid || event?.message?.is_echo)
                    continue;
                try {
                    await this.messaging.ingestMetaMessage(channel.workspace_id, channel.id, String(senderId), String(mid), String(text));
                }
                catch {
                }
            }
        }
    }
    verifySignature(appSecret, rawBody, header) {
        if (!rawBody || !header?.startsWith('sha256='))
            return false;
        const expected = (0, node_crypto_1.createHmac)('sha256', appSecret).update(rawBody).digest('hex');
        const provided = header.slice('sha256='.length);
        const a = Buffer.from(expected, 'hex');
        const b = Buffer.from(provided, 'hex');
        return a.length === b.length && (0, node_crypto_1.timingSafeEqual)(a, b);
    }
    async findChannel(provider, externalAccountId) {
        const supabase = (0, supabase_1.createServiceSupabaseClient)();
        const { data } = await supabase
            .from('messaging_channels')
            .select('id,workspace_id')
            .eq('provider', provider)
            .eq('external_account_id', externalAccountId)
            .eq('status', 'connected')
            .maybeSingle();
        return data ?? null;
    }
};
exports.MetaWebhookController = MetaWebhookController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('hub.mode')),
    __param(1, (0, common_1.Query)('hub.verify_token')),
    __param(2, (0, common_1.Query)('hub.challenge')),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", void 0)
], MetaWebhookController.prototype, "verify", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('x-hub-signature-256')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], MetaWebhookController.prototype, "receive", null);
exports.MetaWebhookController = MetaWebhookController = __decorate([
    (0, common_1.Controller)('webhooks/meta'),
    __metadata("design:paramtypes", [messaging_service_1.MessagingService])
], MetaWebhookController);
//# sourceMappingURL=meta-webhook.controller.js.map