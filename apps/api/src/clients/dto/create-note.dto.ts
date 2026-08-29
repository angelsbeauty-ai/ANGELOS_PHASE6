import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateClientNoteDto {
  @IsOptional() @IsIn(['general','internal','preference','consultation','aftercare']) noteType?: string;
  @IsString() @MaxLength(5000) content!: string;
}
