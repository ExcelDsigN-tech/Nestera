import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { SavingsController } from './savings.controller';
import { SavingsService } from './savings.service';
import { PredictiveEvaluatorService } from './services/predictive-evaluator.service';
import { RecommendationService } from './services/recommendation.service';
import { SavingsProduct } from './entities/savings-product.entity';
import { UserSubscription } from './entities/user-subscription.entity';
import { SavingsGoal } from './entities/savings-goal.entity';
import { WithdrawalRequest } from './entities/withdrawal-request.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { User } from '../user/entities/user.entity';
import { WaitlistEntry } from './entities/waitlist-entry.entity';
import { WaitlistEvent } from './entities/waitlist-event.entity';
import { WaitlistService } from './waitlist.service';
import { WaitlistController } from './waitlist.controller';
import { SavingsGoalTemplate } from './entities/savings-goal-template.entity';
import { SavingsGoalTemplateUsage } from './entities/savings-goal-template-usage.entity';
import { SavingsGoalMilestone } from './entities/savings-goal-milestone.entity';
import { SavingsProductPerformance } from './entities/savings-product-performance.entity';
import { AutoDepositSchedule } from './entities/auto-deposit-schedule.entity';
import { GoalTemplatesService } from './services/goal-templates.service';
import { GoalMilestonesService } from './services/goal-milestones.service';
import { ProductComparisonService } from './services/product-comparison.service';
import { AutoDepositService } from './services/auto-deposit.service';
import { MailModule } from '../mail/mail.module';
import { MilestoneRewardsService } from './services/milestone-rewards.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MailModule,
    TypeOrmModule.forFeature([
      SavingsProduct,
      UserSubscription,
      SavingsGoal,
      WithdrawalRequest,
      Transaction,
      User,
      WaitlistEntry,
      WaitlistEvent,
      SavingsGoalTemplate,
      SavingsGoalTemplateUsage,
      SavingsGoalMilestone,
      SavingsProductPerformance,
      AutoDepositSchedule,
    ]),
  ],
  controllers: [SavingsController, WaitlistController],
  providers: [
    SavingsService,
    PredictiveEvaluatorService,
    RecommendationService,
    WaitlistService,
    GoalTemplatesService,
    GoalMilestonesService,
    ProductComparisonService,
    AutoDepositService,
    MilestoneRewardsService,
  ],
  exports: [SavingsService, WaitlistService],
})
export class SavingsModule {}
