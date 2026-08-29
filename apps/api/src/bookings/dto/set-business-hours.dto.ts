import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsBoolean, IsInt, IsOptional, IsString, Matches, Max, Min, ValidateNested } from 'class-validator';

class BusinessHourDto {
  @IsInt() @Min(0) @Max(6) dayOfWeek!: number;
  @IsOptional() @IsString() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) startTime?: string;
  @IsOptional() @IsString() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) endTime?: string;
  @IsBoolean() isClosed!: boolean;
}

export class SetBusinessHoursDto {
  @IsArray() @ArrayMaxSize(7) @ValidateNested({ each: true }) @Type(() => BusinessHourDto)
  hours!: BusinessHourDto[];
}
