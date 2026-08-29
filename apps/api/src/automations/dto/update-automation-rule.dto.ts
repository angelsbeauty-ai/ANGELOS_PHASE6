import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';
export class UpdateAutomationRuleDto {
  @IsOptional() @IsBoolean() enabled?: boolean;
  @IsOptional() @IsInt() @Min(0) delayMinutes?: number;
  @IsOptional() @IsString() messageTemplate?: string;
}
