import { IsIn, IsString, MaxLength } from 'class-validator';

export class CreateMemoryDto {
  @IsIn(['business_knowledge', 'preference', 'brand', 'workflow', 'marketing_learning'])
  category!: 'business_knowledge' | 'preference' | 'brand' | 'workflow' | 'marketing_learning';

  @IsString()
  @MaxLength(1000)
  content!: string;
}
