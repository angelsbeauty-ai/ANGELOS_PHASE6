import { IsBoolean, IsEmail, IsIn, IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class CreateClientDto {
  @IsOptional() @IsString() @MaxLength(80) firstName?: string;
  @IsOptional() @IsString() @MaxLength(80) lastName?: string;
  @IsString() @Length(1, 160) displayName!: string;
  @IsOptional() @IsEmail() @MaxLength(200) email?: string;
  @IsOptional() @IsString() @MaxLength(60) phone?: string;
  @IsOptional() @IsString() @MaxLength(20) language?: string;
  @IsOptional() @IsIn(['lead','warm','booking_intent','booked','active','returning','inactive']) status?: string;
  @IsOptional() @IsString() @MaxLength(120) source?: string;
  @IsOptional() @IsBoolean() doNotAutoMessage?: boolean;
}
