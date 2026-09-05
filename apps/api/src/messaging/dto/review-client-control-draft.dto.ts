import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Deliberately contains no send flag or actor fields. The authenticated
 * workspace owner is the reviewer, and the database keeps every result
 * send-locked during the LINE Client Control staging phase.
 */
export class ReviewClientControlDraftDto {
  @IsIn(['approve', 'edit', 'reject'])
  decision!: 'approve' | 'edit' | 'reject';

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  editedBody?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  englishMeaning?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}
