import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateCustomMilestoneDto {
  @ApiProperty({ example: 'Halfway celebration' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 40 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  percentage?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  shareable?: boolean;

  @ApiPropertyOptional({ example: { badge: 'Momentum Builder' } })
  @IsOptional()
  metadata?: Record<string, any>;
}
