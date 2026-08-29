import { IsEmail, IsInt, IsOptional, Max, Min } from 'class-validator';
export class CreateStudentDiscountDto {
  @IsOptional() @IsEmail() emailHint?: string;
  @IsOptional() @IsInt() @Min(1) @Max(100) discountPercent?: number;
}
