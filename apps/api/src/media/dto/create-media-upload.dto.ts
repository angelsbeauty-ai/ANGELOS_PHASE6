import { IsDateString, IsIn, IsInt, IsObject, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export class CreateMediaUploadDto {
  @IsString() @MaxLength(240) filename!: string;
  @IsString() @MaxLength(120) mimeType!: string;
  @IsOptional() @IsInt() @Min(0) @Max(262144000) sizeBytes?: number;
  @IsOptional() @IsInt() @Min(1) @Max(50000) width?: number;
  @IsOptional() @IsInt() @Min(1) @Max(50000) height?: number;
  @IsOptional() @IsInt() @Min(0) @Max(86400000) durationMs?: number;
  @IsOptional() @IsIn(['phone_photos','camera','phone_files','import','generated','other']) source?: string;
  @IsOptional() @IsDateString() capturedAt?: string;
  @IsOptional() @IsUUID() clientId?: string;
  @IsOptional() @IsUUID() appointmentId?: string;
  @IsOptional() @IsUUID() treatmentRecordId?: string;
  @IsOptional() @IsIn(['before','after','healed','touch_up','client_submitted','consultation','content_source','document','other']) role?: string;
  @IsOptional() @IsIn(['unknown','private','treatment_only','marketing_approved','limited']) marketingPermission?: string;
  @IsOptional() @IsObject() marketingScope?: Record<string, unknown>;
}
