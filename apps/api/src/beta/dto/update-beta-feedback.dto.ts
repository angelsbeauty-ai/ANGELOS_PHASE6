import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
export class UpdateBetaFeedbackDto {
  @IsOptional() @IsIn(['new','reviewing','resolved','archived']) status?: 'new'|'reviewing'|'resolved'|'archived';
  @IsOptional() @IsString() @MaxLength(2000) founderNote?: string;
}
