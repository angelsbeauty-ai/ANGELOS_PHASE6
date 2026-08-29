import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateConversationDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  currentScreen?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  currentEntityType?: string;

  @IsOptional()
  @IsUUID()
  currentEntityId?: string;
}
