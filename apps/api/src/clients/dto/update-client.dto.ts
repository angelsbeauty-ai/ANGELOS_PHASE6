import { IsBoolean, IsEmail, IsIn, IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class UpdateClientDto {
  @IsOptional() @IsString() @MaxLength(80) firstName?: string | null;
  @IsOptional() @IsString() @MaxLength(80) lastName?: string | null;
  @IsOptional() @IsString() @Length(1, 160) displayName?: string;
  @IsOptional() @IsEmail() @MaxLength(200) email?: string | null;
  @IsOptional() @IsString() @MaxLength(60) phone?: string | null;
  @IsOptional() @IsString() @MaxLength(20) language?: string;
  @IsOptional() @IsIn(['lead','warm','booking_intent','booked','active','returning','inactive']) status?: string;
  @IsOptional() @IsString() @MaxLength(120) source?: string | null;
  @IsOptional() @IsBoolean() doNotAutoMessage?: boolean;
}
