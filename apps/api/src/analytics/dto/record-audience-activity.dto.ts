import { IsIn, IsInt, IsObject, IsOptional, Max, Min } from 'class-validator';

export class RecordAudienceActivityDto {
  @IsIn(['instagram','facebook','tiktok','manual'])
  platform!: 'instagram' | 'facebook' | 'tiktok' | 'manual';

  @IsInt() @Min(0) @Max(6)
  dayOfWeek!: number;

  @IsInt() @Min(0) @Max(23)
  hourLocal!: number;

  @IsInt() @Min(0)
  activeFollowers!: number;

  @IsOptional() @IsObject()
  rawMetrics?: Record<string, unknown>;
}
