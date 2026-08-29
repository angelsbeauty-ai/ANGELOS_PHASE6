import { IsBoolean, IsIn, IsOptional } from 'class-validator';
export class UpdateFeatureFlagDto {
  @IsOptional() @IsBoolean() enabled?: boolean;
  @IsOptional() @IsIn(['stable','beta','paused','off']) stage?: 'stable' | 'beta' | 'paused' | 'off';
}
