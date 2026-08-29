import { IsIn, IsObject, IsOptional } from 'class-validator';

export class UpdateMediaAssetDto {
  @IsOptional() @IsIn(['unknown','private','treatment_only','marketing_approved','limited']) marketingPermission?: string;
  @IsOptional() @IsObject() marketingScope?: Record<string, unknown>;
  @IsOptional() @IsIn(['unused','reviewed','selected','ready','posted','archived']) contentStatus?: string;
  @IsOptional() @IsIn(['active','archived']) lifecycleStatus?: string;
}
