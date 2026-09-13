import { IsString, IsOptional, Length } from 'class-validator';

export class SendVoiceMessageDto {
  @IsString()
  @Length(1, 10_000_000)
  audioBase64!: string;

  @IsOptional()
  @IsString()
  filename?: string;
}