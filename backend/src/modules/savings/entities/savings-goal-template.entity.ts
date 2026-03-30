import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('savings_goal_templates')
@Index(['name'], { unique: true })
@Index(['isActive'])
export class SavingsGoalTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  suggestedAmount: string;

  @Column({ type: 'int' })
  suggestedDurationMonths: number;

  @Column({ type: 'varchar', length: 120 })
  icon: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
