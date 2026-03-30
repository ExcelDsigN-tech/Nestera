import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum GoalMilestoneType {
  AUTO = 'AUTO',
  CUSTOM = 'CUSTOM',
}

@Entity('savings_goal_milestones')
@Index(['goalId'])
@Index(['userId'])
@Index(['goalId', 'percentage'])
export class SavingsGoalMilestone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  goalId: string;

  @Column('uuid')
  userId: string;

  @Column({
    type: 'enum',
    enum: GoalMilestoneType,
    default: GoalMilestoneType.AUTO,
  })
  type: GoalMilestoneType;

  @Column({ type: 'int', nullable: true })
  percentage: number | null;

  @Column({ type: 'varchar', length: 140, nullable: true })
  title: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  targetAmount: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  achievedAmount: string | null;

  @Column({ type: 'int', default: 0 })
  bonusPoints: number;

  @Column({ type: 'varchar', length: 120, nullable: true })
  shareCode: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn()
  createdAt: Date;
}
