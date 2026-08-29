import { IsDateString, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCalendarBlockDto {
  @IsString() @MaxLength(160) title!: string;
  @IsIn(['hard','soft','personal','student','content','other']) blockType!: string;
  @IsDateString() startAt!: string;
  @IsDateString() endAt!: string;
  @IsOptional() @IsString() @MaxLength(1000) notes?: string;
}
