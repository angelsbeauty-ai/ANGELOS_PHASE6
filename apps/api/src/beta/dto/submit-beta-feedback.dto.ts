import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
export class SubmitBetaFeedbackDto {
  @IsIn(['bug','friction','idea','success','testimonial_candidate','support']) category!: 'bug'|'friction'|'idea'|'success'|'testimonial_candidate'|'support';
  @IsString() @MinLength(1) @MaxLength(4000) message!: string;
  @IsOptional() @IsInt() @Min(1) @Max(5) rating?: number;
  @IsOptional() @IsBoolean() permissionToContact?: boolean;
  @IsOptional() @IsBoolean() permissionToQuote?: boolean;
}
