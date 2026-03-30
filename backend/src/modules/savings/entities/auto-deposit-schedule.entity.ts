import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum AutoDepositFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  BI_WEEKLY = 'BI_WEEKLY',
  MONTHLY = 'MONTHLY',
}

export enum AutoDepositStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  CANCELLED = 'CANCELLED',
}

@Entity('savings_auto_deposit_schedules')
@Index(['userId'])
@Index(['status'])
@Index(['nextRunAt'])
export class AutoDepositSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column('uuid')
  productId: string;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  amount: string;

  @Column({ type: 'enum', enum: AutoDepositFrequency })
  frequency: AutoDepositFrequency;

  @Column({
    type: 'enum',
    enum: AutoDepositStatus,
    default: AutoDepositStatus.ACTIVE,
  })
  status: AutoDepositStatus;

  @Column({ type: 'timestamp' })
  nextRunAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastRunAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  pausedAt: Date | null;

  @Column({ type: 'int', default: 0 })
  retryCount: number;

  @Column({ type: 'int', default: 5 })
  maxRetries: number;

  @Column({ type: 'timestamp', nullable: true })
  lastFailureAt: Date | null;

  @Column({ type: 'text', nullable: true })
  lastFailureReason: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
