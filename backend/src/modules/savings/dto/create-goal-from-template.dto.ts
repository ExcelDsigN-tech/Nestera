import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateGoalFromTemplateDto {
  @ApiPropertyOptional({ example: 'Emergency Buffer' })
  @IsOptional()
  @IsString()
  goalName?: string;

  @ApiPropertyOptional({ example: 1200 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  targetAmount?: number;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  durationMonths?: number;

  @ApiPropertyOptional({ example: '2027-12-01' })
  @IsOptional()
  @IsDateString()
  targetDate?: string;

  @ApiPropertyOptional({
    example: { icon: 'shield', color: '#0F766E' },
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
