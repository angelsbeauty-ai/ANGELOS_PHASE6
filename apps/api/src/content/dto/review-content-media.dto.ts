import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewContentMediaDto {
  @IsOptional() @IsIn(['reach','engagement','saves','profile_visits','inquiries','bookings','education','trust','availability']) objective?: string;
  @IsOptional() @IsString() @MaxLength(160) serviceFocus?: string;
}
