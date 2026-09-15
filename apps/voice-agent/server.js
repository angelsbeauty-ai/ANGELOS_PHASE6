// HTTP server that starts a Hermes agent in a given LiveKit room.
// POST /join { "roomName": "..." }
// Env: LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET, OPENAI_API_KEY, PORT (default 8787)

import { createServer } from 'http';
import { AccessToken } from 'livekit-server-sdk';
import OpenAI from 'openai';
import { tmpdir } from 'os';
import { join } from 'path';
import { createWriteStream } from 'fs';
import { spawn } from 'child_process';

const url = process.env.LIVEKIT_URL;
const apiKey = process.env.LIVEKIT_API_KEY;
const apiSecret = process.env.LIVEKIT_API_SECRET;
const openAiKey = process.env.OPENAI_API_KEY;
const port = Number(process.env.PORT || 8787);

if (!url || !apiKey || !apiSecret || !openAiKey) {
  console.error('Missing env vars: LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET, OPENAI_API_KEY');
  process.exit(1);
}

const openai = new OpenAI({ apiKey: openAiKey });
const HERMES_SYSTEM = `You are Hermes, the AngelOS AI voice assistant. Speak in short, natural sentences (1–3 sentences). Be calm, helpful, and concise. You are talking to a user over voice in real time.`;

console.log('Hermes voice agent HTTP server starting on port', port);

const { Room } = await import('livekit-client');

async function runAgentInRoom(roomName) {
  console.log('Starting agent in room:', roomName);

  const grant = { roomJoin: true, room: roomName, canPublish: true, canSubscribe: true, canPublishData: true };
  const token = new AccessToken(apiKey, apiSecret, { identity: 'hermes-agent', name: 'Hermes', ttl: 60 * 5 });
  token.addGrant(grant);
  const jwt = token.toJwt();

  const room = new Room({ adaptiveStream: false, dynacast: false });
  await room.connect(url, jwt, { autoSubscribe: true });
  console.log('Agent joined room:', roomName);

  // Simulated conversation loop (replace with real STT later).
  const initialReply = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: HERMES_SYSTEM },
      { role: 'user', content: 'Say a short friendly hello as Hermes, 1 sentence.' },
    ],
    temperature: 0.3,
    max_tokens: 40,
  });
  const text = initialReply.choices[0]?.message?.content?.trim() || 'Hello, I am Hermes.';
  console.log('Hermes:', text);

  const tts = await openai.audio.speech.create({ model: 'tts-1', voice: 'alloy', input: text });
  const file = join(tmpdir(), `hermes-${Date.now()}.mp3`);
  const writer = createWriteStream(file);
  for await (const chunk of tts.body) writer.write(chunk);
  writer.end();
  await new Promise((res) => writer.on('finish', res));
  console.log('TTS audio written to:', file);

  // Keep the agent alive for a few minutes, then leave.
  setTimeout(async () => {
    console.log('Agent leaving room:', roomName);
    await room.disconnect();
  }, 3 * 60 * 1000);
}

createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(200, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'content-type' });
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/join') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', async () => {
      try {
        const { roomName } = JSON.parse(body);
        if (!roomName) throw new Error('Missing roomName');
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ status: 'ok', room: roomName }));
        await runAgentInRoom(roomName);
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ error: e?.message || String(e) }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify({ error: 'Not found' }));
}).listen(port);

console.log('Ready. POST /join with { "roomName": "..." } to start an agent.');
