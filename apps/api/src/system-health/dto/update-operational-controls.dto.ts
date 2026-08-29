import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateOperationalControlsDto {
  @IsOptional() @IsBoolean() pauseAiActions?: boolean;
  @IsOptional() @IsBoolean() pauseAutomations?: boolean;
  @IsOptional() @IsBoolean() emergencyReadOnly?: boolean;
  @IsOptional() @IsString() @MaxLength(500) reason?: string;
}
