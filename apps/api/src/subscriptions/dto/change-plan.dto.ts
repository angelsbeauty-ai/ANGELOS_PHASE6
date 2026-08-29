import { IsIn } from 'class-validator';
export class ChangePlanDto { @IsIn(['monthly','yearly']) billingInterval!: 'monthly' | 'yearly'; }
