import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';
import { AutoDepositFrequency } from '../entities/auto-deposit-schedule.entity';

export class CreateAutoDepositDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID('4')
  productId: string;

  @ApiProperty({ example: 100 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({
    enum: AutoDepositFrequency,
    example: AutoDepositFrequency.WEEKLY,
  })
  @IsEnum(AutoDepositFrequency)
  frequency: AutoDepositFrequency;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxRetries?: number;

  @ApiPropertyOptional({ example: { note: 'Payroll synced' } })
  @IsOptional()
  metadata?: Record<string, any>;
}
