import { IsNumber, IsObject, IsOptional, IsString, Max, Min } from 'class-validator';

export class RecordContentMetricsDto {
  @IsOptional() @IsNumber() @Min(0) reach?: number;
  @IsOptional() @IsNumber() @Min(0) impressions?: number;
  @IsOptional() @IsNumber() @Min(0) views?: number;
  @IsOptional() @IsNumber() @Min(0) watchTimeSeconds?: number;
  @IsOptional() @IsNumber() @Min(0) averageWatchTimeSeconds?: number;
  @IsOptional() @IsNumber() @Min(0) likes?: number;
  @IsOptional() @IsNumber() @Min(0) comments?: number;
  @IsOptional() @IsNumber() @Min(0) saves?: number;
  @IsOptional() @IsNumber() @Min(0) shares?: number;
  @IsOptional() @IsNumber() @Min(0) profileVisits?: number;
  @IsOptional() @IsNumber() @Min(0) linkClicks?: number;
  @IsOptional() @IsNumber() @Min(0) dms?: number;
  @IsOptional() @IsNumber() @Min(0) inquiries?: number;
  @IsOptional() @IsNumber() @Min(0) bookings?: number;
  @IsOptional() @IsNumber() @Min(0) revenue?: number;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsNumber() @Min(0) @Max(1) completionRate?: number;
  @IsOptional() @IsObject() rawMetrics?: Record<string, unknown>;
}
