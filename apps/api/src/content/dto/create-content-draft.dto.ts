import { ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateContentDraftDto {
  @IsString() @MaxLength(160) title!: string;
  @IsIn(['reach','engagement','saves','profile_visits','inquiries','bookings','education','trust','availability']) objective!: string;
  @IsOptional() @IsString() @MaxLength(500) goal?: string;
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(10) @IsUUID('4', { each: true }) mediaAssetIds!: string[];
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(4) @IsIn(['instagram','facebook','tiktok','manual'], { each: true }) platforms!: string[];
}
