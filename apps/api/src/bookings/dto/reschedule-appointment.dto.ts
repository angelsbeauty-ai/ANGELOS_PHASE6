import { IsBoolean, IsDateString, IsOptional } from 'class-validator';

export class RescheduleAppointmentDto {
  @IsDateString() startAt!: string;
  @IsOptional() @IsBoolean() overrideSoftConflict?: boolean;
}
