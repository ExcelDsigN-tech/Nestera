import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsUUID } from 'class-validator';

export class CompareProductsDto {
  @ApiProperty({
    type: [String],
    description: 'Array of savings product IDs (max 5)',
    minItems: 2,
    maxItems: 5,
  })
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(5)
  @IsUUID('4', { each: true })
  productIds: string[];
}
