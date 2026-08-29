import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class IngestMessageDto {
  @IsUUID() channelId!: string;
  @IsString() @MaxLength(200) externalThreadId!: string;
  @IsString() @MaxLength(200) externalUserId!: string;
  @IsOptional() @IsString() @MaxLength(120) contactDisplayName?: string;
  @IsOptional() @IsUUID() clientId?: string;
  @IsString() @MaxLength(5000) body!: string;
  @IsOptional() @IsString() @MaxLength(200) externalMessageId?: string;
  @IsOptional() @IsString() @MaxLength(16) language?: string;
  @IsOptional() @IsIn(['verified','possible','unverified']) matchConfidence?: 'verified' | 'possible' | 'unverified';
}
