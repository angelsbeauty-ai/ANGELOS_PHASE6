// Minimal Hermes voice agent (Node.js scaffold).
// This is a placeholder for a full STT → LLM → TTS loop in a LiveKit room.
// To run:
// 1. Set env: LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET, OPENAI_API_KEY
// 2. npm install
// 3. node index.js

import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';
import OpenAI from 'openai';

const url = process.env.LIVEKIT_URL;
const apiKey = process.env.LIVEKIT_API_KEY;
const apiSecret = process.env.LIVEKIT_API_SECRET;
const openAiKey = process.env.OPENAI_API_KEY;

if (!url || !apiKey || !apiSecret || !openAiKey) {
  console.error('Missing env vars: LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET, OPENAI_API_KEY');
  process.exit(1);
}

const openai = new OpenAI({ apiKey: openAiKey });

const HERMES_SYSTEM = `You are Hermes, the AngelOS AI voice assistant. Speak in short, natural sentences (1–3 sentences). Be calm, helpful, and concise. You are talking to a user over voice in real time.`;

console.log('Hermes voice agent scaffold running. Extend this file to:');
console.log('1. Accept a room name (e.g. via CLI arg or HTTP endpoint).');
console.log('2. Join that room as "hermes-agent" using LiveKit.');
console.log('3. Listen to user audio, transcribe (STT), call OpenAI, synthesize speech (TTS), and publish audio back to the room.');

// Example: create an agent token for a given room (used by client or orchestrator)
export function createAgentToken(roomName) {
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
  return token.toJwt();
}

// Placeholder for future: joinRoom(roomName) that implements the full audio loop.
