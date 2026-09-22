// Hermes voice agent HTTP server — text-based voice responses (saves TTS credits).
// POST /join { "roomName": "...", "userId?: string" }
// Env: LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET, OPENAI_API_KEY, PORT, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Optional: SEND_TTS_AUDIO=true (fallback to OpenAI TTS audio instead of text data)

import { createServer } from 'http';
import { AccessToken } from 'livekit-server-sdk';
import OpenAI from 'openai';
import { tmpdir } from 'os';
import { join } from 'path';
import { createWriteStream, createReadStream, unlinkSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const url = process.env.LIVEKIT_URL;
const apiKey = process.env.LIVEKIT_API_KEY;
const apiSecret = process.env.LIVEKIT_API_SECRET;
const openAiKey = process.env.OPENAI_API_KEY;
const port = Number(process.env.PORT || 8787);
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !apiKey || !apiSecret || !openAiKey) {
  console.error('Missing env vars: LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET, OPENAI_API_KEY');
  process.exit(1);
}

const openai = new OpenAI({ apiKey: openAiKey });
const HERMES_SYSTEM = `You are Hermes, the AngelOS AI voice assistant. Speak in short, natural sentences (1-3 sentences). Be calm, helpful, and concise. You are talking to a user over voice in real time.`;

console.log('Hermes voice agent HTTP server starting on port', port);

// Dynamic import for livekit-client (ESM)
const { Room, createAudioTrack } = await import('livekit-client');

// Supabase client for conversation memory
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
if (!supabase) {
  console.warn('No Supabase DB configured; conversation memory disabled.');
}

async function loadHistory(userId) {
  if (!supabase || !userId) return [];
  try {
    const { data, error } = await supabase
      .from('hermes_conversations')
      .select('role, content')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(20);
    if (error) throw error;
    return (data || []).map((r) => ({ role: r.role, content: r.content }));
  } catch (e) {
    console.error('Load history error:', e);
    return [];
  }
}

async function saveTurn(userId, userText, assistantText) {
  if (!supabase || !userId) return;
  try {
    await supabase.from('hermes_conversations').insert([
      { user_id: userId, role: 'user', content: userText },
      { user_id: userId, role: 'assistant', content: assistantText },
    ]);
  } catch (e) {
    console.error('Save turn error:', e);
  }
}

async function speakAndPublish(room, text) {
  console.log('Hermes:', text);

  // Send text to the room via data channel — phone plays it with on-device TTS (free).
  // This saves OpenAI TTS credits on every turn vs sending PCM audio.
  try {
    const payload = JSON.stringify({ type: 'agent-text', text });
    await room.localParticipant.publishData(new TextEncoder().encode(payload), { topic: 'chat' });
    console.log('Sent agent text to room:', text);
  } catch (e) {
    console.error('Failed to publish agent text:', e);
  }

  // Fallback: also send TTS audio if phone doesn't handle on-device TTS.
  // Disabled by default to save credits — enable by setting SEND_TTS_AUDIO=true.
  if (process.env.SEND_TTS_AUDIO === 'true') {
    try {
      const tts = await openai.audio.speech.create({
        model: 'tts-1',
        voice: 'alloy',
        input: text,
        response_format: 'pcm',
      });

      const file = join(tmpdir(), `hermes-${Date.now()}.pcm`);
      const writer = createWriteStream(file);

      for await (const chunk of tts.body) {
        writer.write(chunk);
      }
      writer.end();
      await new Promise((res) => writer.on('finish', res));

      const audioStream = createReadStream(file, { highWaterMark: 16384 });
      const audioTrack = createAudioTrack(
        'hermes-audio',
        audioStream,
        { source: 'microphone', sampleRate: 24000, channelCount: 1 }
      );

      await room.localParticipant.publishTrack(audioTrack, { name: 'hermes-speech' });
      console.log('Published audio track for:', text);

      audioStream.on('end', () => {
        console.log('Finished playing audio for:', text);
        unlinkSync(file);
      });
    } catch (e) {
      console.error('TTS audio publish failed:', e);
    }
  }
}

async function runAgentInRoom(roomName, userId) {
  console.log('Starting agent in room:', roomName, userId ? `(user: ${userId})` : '');

  const grant = { roomJoin: true, room: roomName, canPublish: true, canSubscribe: true, canPublishData: true };
  const token = new AccessToken(apiKey, apiSecret, { identity: 'hermes-agent', name: 'Hermes', ttl: 60 * 5 });
  token.addGrant(grant);
  const jwt = token.toJwt();

  const room = new Room({ adaptiveStream: false, dynacast: false });
  await room.connect(url, jwt, { autoSubscribe: true });
  console.log('Agent joined room:', roomName);

  // Load conversation history from Supabase
  const history = await loadHistory(userId);
  const conversationHistory = [{ role: 'system', content: HERMES_SYSTEM }, ...history];

  // Initial greeting
  const greeting = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      ...conversationHistory,
      { role: 'user', content: userId ? 'Say a short friendly hello and mention you remember this user.' : 'Say a short friendly hello as Hermes, 1 sentence.' },
    ],
    temperature: 0.3,
    max_tokens: 60,
  });
  const greetingText = greeting.choices[0]?.message?.content?.trim() || 'Hello, I am Hermes.';
  await speakAndPublish(room, greetingText);
  if (userId) await saveTurn(userId, '[session-start]', greetingText);

  // Listen for user-speech data messages
  room.on('dataReceived', async (data, participant) => {
    try {
      const msg = JSON.parse(new TextDecoder().decode(data));
      if (msg.type !== 'user-speech' || !msg.text) return;

      const userText = msg.text;
      console.log('User (via data):', userText);
      conversationHistory.push({ role: 'user', content: userText });

      const reply = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: conversationHistory,
        temperature: 0.3,
        max_tokens: 100,
      });
      const replyText = reply.choices[0]?.message?.content?.trim() || '...';
      conversationHistory.push({ role: 'assistant', content: replyText });

      if (userId) await saveTurn(userId, userText, replyText);
      await speakAndPublish(room, replyText);
    } catch (e) {
      console.error('Data message error:', e);
    }
  });

  // Keep agent alive for a few minutes, then leave
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
        const { roomName, userId } = JSON.parse(body);
        if (!roomName) throw new Error('Missing roomName');
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ status: 'ok', room: roomName }));
        await runAgentInRoom(roomName, userId).catch((e) => console.error('Agent error:', e));
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

console.log('Ready. POST /join with { "roomName": "...", "userId?: "..." } to start an agent.');
