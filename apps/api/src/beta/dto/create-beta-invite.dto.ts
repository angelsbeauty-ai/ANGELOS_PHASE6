import { IsEmail, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
export class CreateBetaInviteDto {
  @IsOptional() @IsEmail() emailHint?: string;
  @IsOptional() @IsIn(['angels_beauty','student','outside','partner']) cohort?: 'angels_beauty'|'student'|'outside'|'partner';
  @IsOptional() @IsString() @MaxLength(120) label?: string;
  @IsOptional() @IsString() @MaxLength(120) region?: string;
  @IsOptional() @IsInt() @Min(1) @Max(180) expiresInDays?: number;
}
