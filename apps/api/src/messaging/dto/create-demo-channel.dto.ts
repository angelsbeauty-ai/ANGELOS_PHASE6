import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateDemoChannelDto {
  @IsOptional() @IsString() @MaxLength(80) displayName?: string;
}
