import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GoalMilestonesService } from './goal-milestones.service';
import { SavingsGoalMilestone } from '../entities/savings-goal-milestone.entity';
import { SavingsGoal } from '../entities/savings-goal.entity';
import { SavingsService } from '../savings.service';

describe('GoalMilestonesService', () => {
  let service: GoalMilestonesService;

  const milestoneRepo = {
    find: jest.fn(),
    create: jest.fn((v) => v),
    save: jest.fn(async (v) => ({ id: 'm1', ...v })),
  };

  const goalRepo = {
    findOne: jest.fn(),
  };

  const savingsService = {
    findMyGoals: jest.fn(),
  };

  const eventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoalMilestonesService,
        {
          provide: getRepositoryToken(SavingsGoalMilestone),
          useValue: milestoneRepo,
        },
        { provide: getRepositoryToken(SavingsGoal), useValue: goalRepo },
        { provide: SavingsService, useValue: savingsService },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get<GoalMilestonesService>(GoalMilestonesService);
    jest.clearAllMocks();
  });

  it('should auto-create 25% and 50% milestones when progress is 52%', async () => {
    goalRepo.findOne.mockResolvedValue({
      id: 'goal-1',
      userId: 'user-1',
      goalName: 'Emergency Fund',
      targetAmount: 1000,
    });
    savingsService.findMyGoals.mockResolvedValue([
      {
        id: 'goal-1',
        currentBalance: 520,
        percentageComplete: 52,
        projectedBalance: 600,
        isOffTrack: false,
      },
    ]);
    milestoneRepo.find.mockResolvedValue([]);

    const created = await service.detectAutomaticMilestones('user-1', 'goal-1');

    expect(created).toHaveLength(2);
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'goal.milestone',
      expect.objectContaining({ percentage: 25 }),
    );
  });
});
