import { Body, Controller, Post } from '@nestjs/common';
import { CreateVoiceSessionDto } from './dto/create-voice-session.dto';
import { VoiceService } from './voice.service';

@Controller('ai/voice')
export class VoiceController {
  constructor(private readonly voiceService: VoiceService) {}

  @Post('session')
  createSession(@Body() input: CreateVoiceSessionDto) {
    return this.voiceService.createSession(input);
  }
}
