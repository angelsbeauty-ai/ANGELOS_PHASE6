export const ANGEL_SKILLS = [
  { id: 'personal_assistant', name: 'Personal Assistant', detail: 'Organizes your day, priorities and everyday work.' },
  { id: 'business_manager', name: 'Business Manager', detail: 'Operations, clients, bookings and Needs Attention.' },
  { id: 'social_media_marketer', name: 'Social Media Marketer', detail: 'Growth strategy, posting decisions and profile visits.' },
  { id: 'content_creator', name: 'Content Creator', detail: 'Posts, Reels, Stories, hooks and captions.' },
  { id: 'business_advisor', name: 'Business Advisor', detail: 'Priorities, offers and growth moves from real evidence.' },
  { id: 'consultant', name: 'Consultant', detail: 'Deeper tradeoffs when the next step is not obvious.' },
  { id: 'client_communication', name: 'Client Communication', detail: 'Drafts, translation and booking handoff. An AngelOS skill — not Hermes.' }
] as const;

export const VOICE_SKILLS_V1 = [
  { id: 'long_press', name: 'Long-Press Talk', detail: 'Hold the microphone to speak. Release to send.' },
  { id: 'hands_free', name: 'Hands-Free Conversation', detail: 'Speak naturally without holding the button.' },
  { id: 'stt', name: 'Speech-to-Text', detail: 'Converts your voice into instructions.' },
  { id: 'tts', name: 'Text-to-Speech', detail: 'Speaks the bot’s response.' },
  { id: 'screen', name: 'Screen Awareness', detail: 'Knows the current screen in AngelOS.' },
  { id: 'tap', name: 'Tap Awareness', detail: 'Remembers what you just touched.' },
  { id: 'act', name: 'Click, Type, and Scroll', detail: 'Does the action you describe.' },
  { id: 'confirm', name: 'Stop, Pause, Cancel, Confirmation', detail: 'Asks before important actions. Stops when you say so.' },
  { id: 'bot', name: 'Floating Bot Control', detail: 'Drag, minimize, open or close the bot.' },
  { id: 'recover', name: 'Voice Error Recovery', detail: 'Asks you to repeat when it did not understand.' }
] as const;

export const VOICE_SKILLS_LATER = [
  { id: 'vad', name: 'Voice Activity Detection', detail: 'Detects when you start and stop talking.' },
  { id: 'interrupt', name: 'Interruption', detail: 'Say stop or tap the bot while it is speaking.' },
  { id: 'nav', name: 'Voice Navigation', detail: 'Go back, open settings, switch tab.' },
  { id: 'scroll', name: 'Scroll Control', detail: 'Scroll up, down, left or right.' },
  { id: 'memory', name: 'Context Memory', detail: 'Remembers what you were explaining in this task.' },
  { id: 'commands', name: 'Voice Commands', detail: 'Pause, cancel, repeat, make it shorter.' },
  { id: 'multidevice', name: 'Multi-device Voice', detail: 'Same voice path on computer and phone.' },
  { id: 'privacy', name: 'Voice Privacy Control', detail: 'Mute, end session, show listening status.' },
  { id: 'progress', name: 'Spoken Progress Updates', detail: 'Briefly tells you what it is doing.' },
  { id: 'handoff', name: 'Voice Task Handoff', detail: 'Sends a task to the correct AngelOS skill.' }
] as const;
