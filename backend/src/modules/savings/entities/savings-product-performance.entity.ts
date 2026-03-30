import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('savings_product_performance')
@Index(['productId', 'recordedAt'])
export class SavingsProductPerformance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  productId: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  apy: string;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  tvl: string;

  @Column({ type: 'decimal', precision: 6, scale: 2, default: 0 })
  fees: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn()
  recordedAt: Date;
}
