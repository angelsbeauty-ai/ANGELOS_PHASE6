import { IsBoolean, IsIn, IsOptional } from 'class-validator';

export class UpdateThreadDto {
  @IsOptional() @IsIn(['needs_reply','waiting_client','booking_in_progress','needs_owner','follow_up_due','done','spam_scam']) status?: string;
  @IsOptional() @IsIn(['urgent','today','later']) priority?: string;
  @IsOptional() @IsBoolean() needsOwner?: boolean;
}
