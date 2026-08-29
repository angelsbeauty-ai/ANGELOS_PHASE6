import { IsString, MaxLength } from 'class-validator';
export class InternalNoteDto { @IsString() @MaxLength(5000) content!: string; }
