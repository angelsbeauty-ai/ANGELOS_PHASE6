import { IsOptional, IsString, Length } from 'class-validator';

export class CreateWorkspaceDto {
  @IsString()
  @Length(1, 120)
  name!: string;

  @IsOptional()
  @IsString()
  businessType?: string;

  @IsString()
  timezone!: string;

  @IsString()
  currency!: string;

  @IsString()
  locale!: string;
}
