import { IsDateString, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateFollowupDto {
  @IsString() @MaxLength(500) reason!: string;
  @IsOptional() @IsDateString() dueAt?: string;
  @IsOptional() @IsIn(['open','completed','cancelled']) status?: string;
}
