import { ArrayMaxSize, IsArray, IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateContentVariantDto {
  @IsOptional() @IsString() @MaxLength(300) hook?: string;
  @IsOptional() @IsString() @MaxLength(5000) caption?: string;
  @IsOptional() @IsString() @MaxLength(500) cta?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(30) @IsString({ each: true }) hashtags?: string[];
  @IsOptional() @IsDateString() scheduledFor?: string;
}
