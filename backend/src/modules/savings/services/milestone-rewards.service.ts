import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Injectable()
export class MilestoneRewardsService {
  private readonly logger = new Logger(MilestoneRewardsService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  @OnEvent('goal.milestone.reward')
  async handleMilestoneReward(event: {
    userId: string;
    goalId: string;
    percentage: number;
    points: number;
  }) {
    const user = await this.userRepository.findOne({
      where: { id: event.userId },
      select: ['id', 'rewardPoints'],
    });

    if (!user) {
      return;
    }

    user.rewardPoints =
      Number(user.rewardPoints || 0) + Number(event.points || 0);
    await this.userRepository.save(user);

    this.logger.log(
      `Awarded ${event.points} reward points to user ${event.userId} for ${event.percentage}% goal milestone`,
    );
  }
}
