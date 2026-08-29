import { IsBoolean, IsIn, IsObject, IsOptional, IsString, Length } from 'class-validator';

export class UpdateMarketingProfileDto {
  @IsOptional()
  @IsIn(['reach','engagement','saves','profile_visits','inquiries','bookings','retention','brand_awareness'])
  primaryGoal?: string;

  @IsOptional() @IsString() @Length(0, 500)
  targetClient?: string;

  @IsOptional() @IsString() @Length(0, 200)
  serviceArea?: string;

  @IsOptional() @IsString() @Length(0, 120)
  city?: string;

  @IsOptional() @IsString() @Length(0, 120)
  region?: string;

  @IsOptional() @IsString() @Length(0, 120)
  country?: string;

  @IsOptional()
  @IsIn(['beginner','intermediate','advanced'])
  experienceLevel?: string;

  @IsOptional() @IsObject()
  contentPreferences?: Record<string, unknown>;

  @IsOptional() @IsBoolean()
  localContextEnabled?: boolean;
}
