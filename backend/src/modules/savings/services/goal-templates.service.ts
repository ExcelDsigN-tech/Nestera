import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SavingsGoalTemplate } from '../entities/savings-goal-template.entity';
import { SavingsGoalTemplateUsage } from '../entities/savings-goal-template-usage.entity';
import { SavingsService } from '../savings.service';
import { CreateGoalFromTemplateDto } from '../dto/create-goal-from-template.dto';

@Injectable()
export class GoalTemplatesService {
  constructor(
    @InjectRepository(SavingsGoalTemplate)
    private readonly templateRepository: Repository<SavingsGoalTemplate>,
    @InjectRepository(SavingsGoalTemplateUsage)
    private readonly usageRepository: Repository<SavingsGoalTemplateUsage>,
    private readonly savingsService: SavingsService,
  ) {}

  async listTemplates(): Promise<SavingsGoalTemplate[]> {
    const templates = await this.templateRepository.find({
      where: { isActive: true },
      order: { createdAt: 'ASC' },
    });

    if (templates.length > 0) {
      return templates;
    }

    return this.seedDefaultTemplates();
  }

  async createGoalFromTemplate(
    userId: string,
    templateId: string,
    dto: CreateGoalFromTemplateDto,
  ) {
    const template = await this.templateRepository.findOne({
      where: { id: templateId, isActive: true },
    });

    if (!template) {
      throw new NotFoundException('Savings goal template not found');
    }

    const durationMonths = dto.durationMonths ?? template.suggestedDurationMonths;
    const targetDate = dto.targetDate
      ? new Date(dto.targetDate)
      : this.resolveTargetDate(durationMonths);

    const metadata = {
      ...(template.metadata || {}),
      ...(dto.metadata || {}),
      template: {
        id: template.id,
        name: template.name,
        icon: template.icon,
      },
    };

    const goal = await this.savingsService.createGoal(
      userId,
      dto.goalName ?? template.name,
      dto.targetAmount ?? Number(template.suggestedAmount),
      targetDate,
      metadata,
    );

    await this.usageRepository.save(
      this.usageRepository.create({
        userId,
        goalId: goal.id,
        templateId: template.id,
        customizations: dto,
      }),
    );

    return {
      goal,
      templateUsage: {
        templateId: template.id,
        templateName: template.name,
      },
    };
  }

  private resolveTargetDate(durationMonths: number): Date {
    const now = new Date();
    now.setDate(1);
    now.setMonth(now.getMonth() + durationMonths);
    return now;
  }

  private async seedDefaultTemplates(): Promise<SavingsGoalTemplate[]> {
    const defaults: Array<Partial<SavingsGoalTemplate>> = [
      {
        name: 'Emergency Fund',
        suggestedAmount: '1000',
        suggestedDurationMonths: 6,
        icon: 'shield',
        metadata: { category: 'safety' },
        isActive: true,
      },
      {
        name: 'Vacation',
        suggestedAmount: '2500',
        suggestedDurationMonths: 12,
        icon: 'plane',
        metadata: { category: 'lifestyle' },
        isActive: true,
      },
      {
        name: 'Car',
        suggestedAmount: '12000',
        suggestedDurationMonths: 24,
        icon: 'car',
        metadata: { category: 'transport' },
        isActive: true,
      },
      {
        name: 'House',
        suggestedAmount: '40000',
        suggestedDurationMonths: 48,
        icon: 'home',
        metadata: { category: 'housing' },
        isActive: true,
      },
      {
        name: 'Education',
        suggestedAmount: '15000',
        suggestedDurationMonths: 36,
        icon: 'book',
        metadata: { category: 'education' },
        isActive: true,
      },
    ];

    const entities = defaults.map((template) =>
      this.templateRepository.create(template),
    );
    return this.templateRepository.save(entities);
  }
}
