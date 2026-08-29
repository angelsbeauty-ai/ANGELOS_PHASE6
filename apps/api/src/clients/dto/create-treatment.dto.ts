import { IsDateString, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTreatmentDto {
  @IsString() @MaxLength(160) serviceName!: string;
  @IsOptional() @IsIn(['first_session','touch_up','correction','cover_up','other']) stage?: string;
  @IsOptional() @IsString() @MaxLength(160) technique?: string;
  @IsOptional() @IsDateString() performedAt?: string;
  @IsOptional() @IsString() @MaxLength(5000) notes?: string;
}
