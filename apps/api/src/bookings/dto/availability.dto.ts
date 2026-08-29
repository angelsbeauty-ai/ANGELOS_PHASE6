import { IsDateString, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class AvailabilityDto {
  @IsUUID() serviceId!: string;
  @IsDateString() windowStart!: string;
  @IsDateString() windowEnd!: string;
  @IsOptional() @IsInt() @Min(15) @Max(120) stepMinutes?: number;
}
