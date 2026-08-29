import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
export class TrackProductEventDto {
  @IsIn(['screen_view','screen_duration','feature_used','workflow_started','workflow_completed','workflow_abandoned','tap'])
  eventName!: 'screen_view' | 'screen_duration' | 'feature_used' | 'workflow_started' | 'workflow_completed' | 'workflow_abandoned' | 'tap';
  @IsOptional() @IsString() @MaxLength(160) screen?: string;
  @IsOptional() @IsString() @MaxLength(160) feature?: string;
  @IsOptional() @IsString() @MaxLength(160) actionKey?: string;
  @IsOptional() @IsString() @MaxLength(80) outcome?: string;
  @IsOptional() @IsInt() @Min(0) @Max(86400000) durationMs?: number;
}
