import { Type } from 'class-transformer';
import { IsOptional, IsString, IsUUID, MaxLength, ValidateNested } from 'class-validator';

class AiMessageContextDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  screen?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  entityType?: string;

  @IsOptional()
  @IsUUID()
  entityId?: string;
}

export class SendAiMessageDto {
  @IsString()
  @MaxLength(8000)
  message!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AiMessageContextDto)
  context?: AiMessageContextDto;
}
