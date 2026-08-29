import { IsIn, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateConsentDto {
  @IsIn(['treatment','photo_video','marketing','model_student','policy_acknowledgement']) consentType!: string;
  @IsIn(['granted','denied','withdrawn']) status!: string;
  @IsOptional() @IsObject() scope?: Record<string, unknown>;
  @IsOptional() @IsString() @MaxLength(80) formVersion?: string;
}
