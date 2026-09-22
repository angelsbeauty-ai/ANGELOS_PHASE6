// Hermes voice agent (Node.js) – basic STT → LLM → TTS loop in a LiveKit room.
// This is a working scaffold; extend error handling and audio piping as needed.
//
// Env:
//   LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET, OPENAI_API_KEY
//
// Usage (example):
//   node index.js <roomName>

import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';
import OpenAI from 'openai';
import { spawn } from 'child_process';
import { createWriteStream, createReadStream, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const url = process.env.LIVEKIT_URL;
const apiKey = process.env.LIVEKIT_API_KEY;
const apiSecret = process.env.LIVEKIT_API_SECRET;
const openAiKey = process.env.OPENAI_API_KEY;

if (!url || !apiKey || !apiSecret || !openAiKey) {
  console.error('Missing env vars: LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET, OPENAI_API_KEY');
  process.exit(1);
}

const openai = new OpenAI({ apiKey: openAiKey });
const roomName = process.argv[2];
if (!roomName) {
  console.error('Usage: node index.js <roomName>');
  process.exit(1);
}

const HERMES_SYSTEM = `You are Hermes, the AngelOS AI voice assistant. Speak in short, natural sentences (1–3 sentences). Be calm, helpful, and concise. You are talking to a user over voice in real time.`;

console.log('Starting Hermes agent for room:', roomName);

// Create agent token
const grant = {
  roomJoin: true,
  room: roomName,
  canPublish: true,
  canSubscribe: true,
  canPublishData: true,
};
const token = new AccessToken(apiKey, apiSecret, {
  identity: 'hermes-agent',
  name: 'Hermes',
  ttl: 60 * 5,
});
token.addGrant(grant);
const jwt = token.toJwt();

// Dynamic import for livekit-client (ESM)
const { Room } = await import('livekit-client');

const room = new Room({ adaptiveStream: false, dynacast: false });

await room.connect(url, jwt, { autoSubscribe: true });
console.log('Joined room:', room.name);

room.on('participantConnected', (p) => {
  console.log('Participant connected:', p.identity);
});

room.on('trackSubscribed', (track, publication, participant) => {
  if (track.kind === 'audio') {
    console.log('Subscribed to audio track from:', participant.identity);
    // In a full implementation, pipe this audio through an STT service.
    // For this scaffold, we'll simulate user input via console for now.
  }
});

// Simple turn loop: read user text from stdin, call OpenAI, speak via TTS, publish audio.
console.log('Type user speech text and press Enter to simulate a user turn (this is a scaffold).');

const rl = await import('readline');
const readline = rl.createInterface({ input: process.stdin, output: process.stdout });

async function speakText(text) {
  console.log('Hermes:', text);
  const resp = await openai.audio.speech.create({
    model: 'tts-1',
    voice: 'alloy',
    input: text,
  });
  const file = join(tmpdir(), `hermes-${Date.now()}.mp3`);
  const writer = createWriteStream(file);
  for await (const chunk of resp.body) writer.write(chunk);
  writer.end();
  await new Promise((res) => writer.on('finish', res));

  // Publish audio to room (simplified: in a real agent, use an AudioSource/AudioTrack).
  // This scaffold logs the file path; extend to actually publish via livekit-client audio APIs.
  console.log('TTS audio written to:', file);
  // unlinkSync(file);
}

readline.on('line', async (line) => {
  if (!line.trim()) return;
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: HERMES_SYSTEM },
        { role: 'user', content: line },
      ],
      temperature: 0.3,
      max_tokens: 60,
    });
    const reply = completion.choices[0]?.message?.content?.trim() || '...';
    await speakText(reply);
  } catch (e) {
    console.error('LLM error:', e?.message || e);
  }
});

console.log('Hermes agent ready. Type user lines to simulate conversation.');
