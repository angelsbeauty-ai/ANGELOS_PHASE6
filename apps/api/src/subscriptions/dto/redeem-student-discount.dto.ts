import { IsString, Length } from 'class-validator';
export class RedeemStudentDiscountDto { @IsString() @Length(16, 256) token!: string; }
