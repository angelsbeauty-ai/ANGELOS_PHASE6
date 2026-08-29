import { IsDateString } from 'class-validator';

export class ScheduleContentVariantDto {
  @IsDateString() scheduledFor!: string;
}
