import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('savings_goal_template_usage')
@Index(['templateId'])
@Index(['userId'])
@Index(['createdAt'])
export class SavingsGoalTemplateUsage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  templateId: string;

  @Column('uuid')
  userId: string;

  @Column('uuid')
  goalId: string;

  @Column({ type: 'jsonb', nullable: true })
  customizations: Record<string, any> | null;

  @CreateDateColumn()
  createdAt: Date;
}
