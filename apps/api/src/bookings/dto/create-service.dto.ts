import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateServiceDto {
  @IsString() @MaxLength(160) name!: string;
  @IsInt() @Min(5) @Max(1440) durationMinutes!: number;
  @IsOptional() @IsInt() @Min(0) @Max(240) bufferBeforeMinutes?: number;
  @IsOptional() @IsInt() @Min(0) @Max(240) bufferAfterMinutes?: number;
  @IsOptional() @IsNumber() @Min(0) standardPrice?: number;
  @IsOptional() @IsString() @MaxLength(10) currency?: string;
  @IsOptional() @IsBoolean() active?: boolean;
}
