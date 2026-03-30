import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GoalTemplatesService } from './goal-templates.service';
import { SavingsGoalTemplate } from '../entities/savings-goal-template.entity';
import { SavingsGoalTemplateUsage } from '../entities/savings-goal-template-usage.entity';
import { SavingsService } from '../savings.service';

describe('GoalTemplatesService', () => {
  let service: GoalTemplatesService;

  const templateRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((value) => value),
    save: jest.fn(),
  };

  const usageRepo = {
    create: jest.fn((value) => value),
    save: jest.fn(),
  };

  const savingsService = {
    createGoal: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoalTemplatesService,
        {
          provide: getRepositoryToken(SavingsGoalTemplate),
          useValue: templateRepo,
        },
        {
          provide: getRepositoryToken(SavingsGoalTemplateUsage),
          useValue: usageRepo,
        },
        { provide: SavingsService, useValue: savingsService },
      ],
    }).compile();

    service = module.get<GoalTemplatesService>(GoalTemplatesService);
    jest.clearAllMocks();
  });

  it('should seed defaults when no templates exist', async () => {
    templateRepo.find.mockResolvedValue([]);
    templateRepo.save.mockResolvedValue([{ id: 't1', name: 'Emergency Fund' }]);

    const result = await service.listTemplates();

    expect(result.length).toBeGreaterThan(0);
    expect(templateRepo.save).toHaveBeenCalled();
  });

  it('should create goal from template with custom target amount', async () => {
    templateRepo.findOne.mockResolvedValue({
      id: 'template-1',
      name: 'Vacation',
      suggestedAmount: '2500',
      suggestedDurationMonths: 12,
      icon: 'plane',
      metadata: {},
      isActive: true,
    });
    savingsService.createGoal.mockResolvedValue({ id: 'goal-1' });

    const result = await service.createGoalFromTemplate(
      'user-1',
      'template-1',
      {
        targetAmount: 3000,
      },
    );

    expect(result.goal.id).toBe('goal-1');
    expect(savingsService.createGoal).toHaveBeenCalledWith(
      'user-1',
      'Vacation',
      3000,
      expect.any(Date),
      expect.any(Object),
    );
    expect(usageRepo.save).toHaveBeenCalled();
  });
});
