import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateReplyDto {
  @IsString() @MaxLength(5000) body!: string;
  @IsOptional() @IsBoolean() sendNow?: boolean;
  @IsOptional() @IsIn(['faq','booking_confirmation','appointment_reminder','aftercare','follow_up'])
  routineCategory?: 'faq' | 'booking_confirmation' | 'appointment_reminder' | 'aftercare' | 'follow_up';
}
