import { IsString, MinLength } from 'class-validator';
export class RedeemBetaInviteDto {
  @IsString() @MinLength(16) token!: string;
}
