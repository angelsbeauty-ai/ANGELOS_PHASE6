import { IsIn, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class RecordFinanceEntryDto {
  @IsUUID() clientId!: string;
  @IsOptional() @IsUUID() appointmentId?: string;
  @IsIn(['expected','deposit','payment','discount','refund','correction']) entryType!: string;
  @IsNumber() @Min(0) amount!: number;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsString() method?: string;
  @IsOptional() @IsString() note?: string;
  @IsOptional() @IsString() occurredAt?: string;
  @IsOptional() @IsString() idempotencyKey?: string;
  @IsOptional() @IsIn(['increase_expected','decrease_expected','increase_income','decrease_income']) correctionEffect?: string;
}
