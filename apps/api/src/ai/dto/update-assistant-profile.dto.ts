import { IsBoolean, IsIn, IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class UpdateAssistantProfileDto {
  @IsOptional()
  @IsString()
  @Length(1, 60)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  avatarKey?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(1200)
  personalityPrompt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  primaryLanguage?: string;

  @IsOptional()
  @IsIn(['warm_professional', 'direct', 'calm', 'friendly', 'custom'])
  tone?: 'warm_professional' | 'direct' | 'calm' | 'friendly' | 'custom';

  @IsOptional()
  @IsIn(['concise', 'balanced', 'detailed'])
  responseLength?: 'concise' | 'balanced' | 'detailed';

  @IsOptional()
  @IsIn(['low', 'balanced', 'high'])
  proactivity?: 'low' | 'balanced' | 'high';

  @IsOptional()
  @IsIn(['on', 'compact', 'off'])
  floatingButtonMode?: 'on' | 'compact' | 'off';

  @IsOptional()
  @IsBoolean()
  guidanceQuestionsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  explainRecommendations?: boolean;
}
