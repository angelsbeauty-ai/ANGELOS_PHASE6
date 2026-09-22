import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateVoiceSessionDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  userId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  displayName?: string;

  @IsOptional()
  @IsIn(['ja', 'en', 'auto'])
  language?: 'ja' | 'en' | 'auto';
}
