import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import {
  GoalMilestoneType,
  SavingsGoalMilestone,
} from '../entities/savings-goal-milestone.entity';
import { SavingsGoal } from '../entities/savings-goal.entity';
import { SavingsService } from '../savings.service';
import { CreateCustomMilestoneDto } from '../dto/create-custom-milestone.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class GoalMilestonesService {
  private readonly milestoneThresholds = [25, 50, 75, 100] as const;

  constructor(
    @InjectRepository(SavingsGoalMilestone)
    private readonly milestoneRepository: Repository<SavingsGoalMilestone>,
    @InjectRepository(SavingsGoal)
    private readonly goalRepository: Repository<SavingsGoal>,
    private readonly savingsService: SavingsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getGoalMilestones(userId: string, goalId: string) {
    await this.assertGoalOwnership(userId, goalId);

    await this.detectAutomaticMilestones(userId, goalId);

    return this.milestoneRepository.find({
      where: { goalId, userId },
      order: { createdAt: 'ASC' },
    });
  }

  async addCustomMilestone(
    userId: string,
    goalId: string,
    dto: CreateCustomMilestoneDto,
  ): Promise<SavingsGoalMilestone> {
    const goal = await this.assertGoalOwnership(userId, goalId);

    const progress = await this.getGoalProgress(userId, goalId);

    const milestone = this.milestoneRepository.create({
      goalId,
      userId,
      type: GoalMilestoneType.CUSTOM,
      title: dto.title,
      percentage: dto.percentage ?? null,
      targetAmount: String(Number(goal.targetAmount)),
      achievedAmount: String(progress.currentBalance),
      bonusPoints: 0,
      shareCode: dto.shareable ? this.generateShareCode() : null,
      metadata: dto.metadata ?? null,
    });

    return this.milestoneRepository.save(milestone);
  }

  async detectAutomaticMilestones(
    userId: string,
    goalId: string,
  ): Promise<SavingsGoalMilestone[]> {
    const goal = await this.assertGoalOwnership(userId, goalId);
    const progress = await this.getGoalProgress(userId, goalId);

    const achieved = this.milestoneThresholds.filter(
      (threshold) => progress.percentageComplete >= threshold,
    );

    if (achieved.length === 0) {
      return [];
    }

    const existing = await this.milestoneRepository.find({
      where: {
        goalId,
        userId,
        type: GoalMilestoneType.AUTO,
      },
    });

    const existingPercentages = new Set(
      existing
        .map((milestone) => milestone.percentage)
        .filter((percentage): percentage is number => percentage != null),
    );

    const created: SavingsGoalMilestone[] = [];
    for (const percentage of achieved) {
      if (existingPercentages.has(percentage)) {
        continue;
      }

      const bonusPoints = this.resolveBonusPoints(percentage);
      const milestone = await this.milestoneRepository.save(
        this.milestoneRepository.create({
          goalId,
          userId,
          type: GoalMilestoneType.AUTO,
          percentage,
          title: `${percentage}% milestone reached`,
          targetAmount: String(Number(goal.targetAmount)),
          achievedAmount: String(progress.currentBalance),
          bonusPoints,
          shareCode: null,
          metadata: {
            goalName: goal.goalName,
            projectedBalance: progress.projectedBalance,
            isOffTrack: progress.isOffTrack,
            visualProgress: {
              percentage: progress.percentageComplete,
              currentBalance: progress.currentBalance,
              targetAmount: Number(goal.targetAmount),
            },
          },
        }),
      );

      this.eventEmitter.emit('goal.milestone', {
        userId,
        goalId,
        percentage,
        goalName: goal.goalName,
        metadata: {
          bonusPoints,
          source: 'auto-detection',
        },
      });

      // Reward integration via domain event (listener can grant points/tokens)
      this.eventEmitter.emit('goal.milestone.reward', {
        userId,
        goalId,
        percentage,
        points: bonusPoints,
      });

      created.push(milestone);
    }

    return created;
  }

  private async getGoalProgress(userId: string, goalId: string) {
    const goals = await this.savingsService.findMyGoals(userId);
    const progress = goals.find((goal) => goal.id === goalId);

    if (!progress) {
      throw new NotFoundException('Savings goal progress not found');
    }

    return progress;
  }

  private async assertGoalOwnership(
    userId: string,
    goalId: string,
  ): Promise<SavingsGoal> {
    const goal = await this.goalRepository.findOne({
      where: { id: goalId },
    });

    if (!goal) {
      throw new NotFoundException('Savings goal not found');
    }

    if (goal.userId !== userId) {
      throw new ForbiddenException('You cannot access this savings goal');
    }

    return goal;
  }

  private resolveBonusPoints(percentage: number): number {
    if (percentage === 100) {
      return 250;
    }

    if (percentage === 75) {
      return 120;
    }

    if (percentage === 50) {
      return 70;
    }

    return 40;
  }

  private generateShareCode(): string {
    return randomUUID().replace(/-/g, '').slice(0, 16);
  }
}
