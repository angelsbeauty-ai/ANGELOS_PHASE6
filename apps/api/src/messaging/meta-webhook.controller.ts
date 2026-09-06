import { Body, Controller, Get, Headers, Post, Query, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { createServiceSupabaseClient } from '../config/supabase';
import { MessagingService } from './messaging.service';
import { loadMetaAppCredentials } from './meta-transport';

/**
 * Public webhook: Meta calls this directly with no AngelOS bearer token, so unlike every other
 * controller in this API it is intentionally NOT behind SupabaseAuthGuard, and the global
 * workspace-scoped guards (emergency read-only, subscription, feature flags, beta) never fire
 * here either since there is no :workspaceId route param -- same situation as /approvals/*.
 * Protection is the X-Hub-Signature-256 check against the Meta app secret, verified on every
 * POST before anything is written. This route only ever creates inbound threads/messages for
 * owner review in the existing Messages screen; it never sends anything.
 */
@Controller('webhooks/meta')
export class MetaWebhookController {
  constructor(private readonly messaging: MessagingService) {}

  @Get()
  verify(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response
  ) {
    const expected = process.env.META_WEBHOOK_VERIFY_TOKEN;
    if (mode === 'subscribe' && expected && token === expected) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Verification failed');
  }

  @Post()
  async receive(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers('x-hub-signature-256') signature: string | undefined,
    @Body() body: any,
    @Res() res: Response
  ) {
    try {
      const { appSecret } = await loadMetaAppCredentials();
      if (!this.verifySignature(appSecret, req.rawBody, signature)) {
        return res.status(401).send('Invalid signature');
      }
    } catch {
      // App credentials aren't configured yet. Fail closed: never process an unverifiable payload.
      return res.status(503).send('Meta webhook not configured');
    }

    // Acknowledge before processing. Meta disables a webhook subscription that is slow or fails
    // repeatedly, and re-delivers on non-200; dedupe on external_message_id already covers redelivery.
    res.status(200).send('EVENT_RECEIVED');
    await this.process(body).catch(() => {
      // Best-effort background processing; the response is already sent.
    });
  }

  private async process(body: any) {
    const object = body?.object;
    if (object !== 'instagram' && object !== 'page') return;
    const provider = object === 'instagram' ? 'instagram' : 'facebook';

    for (const entry of body?.entry ?? []) {
      const externalAccountId = String(entry?.id ?? '');
      if (!externalAccountId) continue;
      const channel = await this.findChannel(provider, externalAccountId);
      if (!channel) continue;
      for (const event of entry?.messaging ?? []) {
        const text = event?.message?.text;
        const senderId = event?.sender?.id;
        const mid = event?.message?.mid;
        if (!text || !senderId || !mid || event?.message?.is_echo) continue;
        try {
          await this.messaging.ingestMetaMessage(channel.workspace_id, channel.id, String(senderId), String(mid), String(text));
        } catch {
          // One bad event must not drop the rest of the batch.
        }
      }
    }
  }

  private verifySignature(appSecret: string, rawBody: Buffer | undefined, header: string | undefined) {
    if (!rawBody || !header?.startsWith('sha256=')) return false;
    const expected = createHmac('sha256', appSecret).update(rawBody).digest('hex');
    const provided = header.slice('sha256='.length);
    const a = Buffer.from(expected, 'hex');
    const b = Buffer.from(provided, 'hex');
    return a.length === b.length && timingSafeEqual(a, b);
  }

  private async findChannel(provider: string, externalAccountId: string) {
    const supabase = createServiceSupabaseClient();
    const { data } = await supabase
      .from('messaging_channels')
      .select('id,workspace_id')
      .eq('provider', provider)
      .eq('external_account_id', externalAccountId)
      .eq('status', 'connected')
      .maybeSingle();
    return data ?? null;
  }
}
