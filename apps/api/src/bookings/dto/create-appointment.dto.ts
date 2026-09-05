import { IsBoolean, IsDateString, IsOptional, IsString, IsUUID, Length, MaxLength } from 'class-validator';

export class CreateAppointmentDto {
  @IsOptional() @IsString() @Length(8, 128) idempotencyKey?: string;
  @IsUUID() clientId!: string;
  @IsUUID() serviceId!: string;
  @IsDateString() startAt!: string;
  @IsOptional() @IsString() @MaxLength(120) source?: string;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
  @IsOptional() @IsBoolean() overrideSoftConflict?: boolean;
}
