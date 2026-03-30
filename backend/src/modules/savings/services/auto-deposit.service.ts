import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AutoDepositFrequency,
  AutoDepositSchedule,
  AutoDepositStatus,
} from '../entities/auto-deposit-schedule.entity';
import { CreateAutoDepositDto } from '../dto/create-auto-deposit.dto';
import { SavingsProduct } from '../entities/savings-product.entity';
import { SavingsService as BlockchainSavingsService } from '../../blockchain/savings.service';
import { User } from '../../user/entities/user.entity';
import { MailService } from '../../mail/mail.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class AutoDepositService {
  private readonly logger = new Logger(AutoDepositService.name);

  constructor(
    @InjectRepository(AutoDepositSchedule)
    private readonly scheduleRepository: Repository<AutoDepositSchedule>,
    @InjectRepository(SavingsProduct)
    private readonly productRepository: Repository<SavingsProduct>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly blockchainSavingsService: BlockchainSavingsService,
    private readonly mailService: MailService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createSchedule(userId: string, dto: CreateAutoDepositDto) {
    const product = await this.productRepository.findOne({
      where: { id: dto.productId, isActive: true },
    });

    if (!product) {
      throw new NotFoundException('Savings product not found');
    }

    if (dto.amount < Number(product.minAmount)) {
      throw new BadRequestException(
        'Amount is below minimum for selected product',
      );
    }

    const now = new Date();
    const schedule = this.scheduleRepository.create({
      userId,
      productId: dto.productId,
      amount: String(dto.amount),
      frequency: dto.frequency,
      status: AutoDepositStatus.ACTIVE,
      maxRetries: dto.maxRetries ?? 5,
      nextRunAt: this.resolveNextRunAt(now, dto.frequency),
      metadata: dto.metadata ?? null,
    });

    return this.scheduleRepository.save(schedule);
  }

  async listSchedules(userId: string) {
    return this.scheduleRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async pauseSchedule(userId: string, scheduleId: string) {
    const schedule = await this.findOwnedSchedule(userId, scheduleId);
    schedule.status = AutoDepositStatus.PAUSED;
    schedule.pausedAt = new Date();
    return this.scheduleRepository.save(schedule);
  }

  async cancelSchedule(userId: string, scheduleId: string) {
    const schedule = await this.findOwnedSchedule(userId, scheduleId);
    schedule.status = AutoDepositStatus.CANCELLED;
    await this.scheduleRepository.save(schedule);
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async processDueSchedules(): Promise<void> {
    const now = new Date();
    const dueSchedules = await this.scheduleRepository
      .createQueryBuilder('schedule')
      .where('schedule.status = :status', { status: AutoDepositStatus.ACTIVE })
      .andWhere('schedule.nextRunAt <= :now', { now: now.toISOString() })
      .getMany();

    for (const schedule of dueSchedules) {
      await this.processSingleSchedule(schedule);
    }
  }

  private async processSingleSchedule(schedule: AutoDepositSchedule) {
    const user = await this.userRepository.findOne({
      where: { id: schedule.userId },
      select: ['id', 'email', 'name', 'publicKey'],
    });

    if (!user) {
      this.logger.warn(
        `User ${schedule.userId} not found for auto-deposit ${schedule.id}`,
      );
      return;
    }

    await this.mailService.sendRawMail(
      user.email,
      'Upcoming auto-deposit reminder',
      `Your scheduled savings auto-deposit of ${schedule.amount} will run shortly.`,
    );

    try {
      const product = await this.productRepository.findOneBy({
        id: schedule.productId,
      });

      // Smart contract integration hook: call autosave entrypoint when available.
      if (user.publicKey && product?.contractId) {
        await this.blockchainSavingsService.invokeContractRead(
          product.contractId,
          'autosave',
          [],
          user.publicKey,
        );
      }

      this.eventEmitter.emit('savings.auto_deposit.executed', {
        userId: schedule.userId,
        scheduleId: schedule.id,
        amount: Number(schedule.amount),
        productId: schedule.productId,
      });

      schedule.retryCount = 0;
      schedule.lastFailureAt = null;
      schedule.lastFailureReason = null;
      schedule.lastRunAt = new Date();
      schedule.nextRunAt = this.resolveNextRunAt(
        schedule.lastRunAt,
        schedule.frequency,
      );
      await this.scheduleRepository.save(schedule);
    } catch (error) {
      const previousRetry = schedule.retryCount;
      schedule.retryCount += 1;
      schedule.lastFailureAt = new Date();
      schedule.lastFailureReason = (error as Error).message;

      if (schedule.retryCount > schedule.maxRetries) {
        schedule.status = AutoDepositStatus.PAUSED;
      } else {
        schedule.nextRunAt = this.resolveRetryTime(previousRetry + 1);
      }

      await this.scheduleRepository.save(schedule);

      this.eventEmitter.emit('savings.auto_deposit.failed', {
        userId: schedule.userId,
        scheduleId: schedule.id,
        retryCount: schedule.retryCount,
        reason: schedule.lastFailureReason,
      });
    }
  }

  private resolveRetryTime(retryAttempt: number): Date {
    const now = Date.now();
    const delayMinutes = Math.pow(2, retryAttempt);
    return new Date(now + delayMinutes * 60 * 1000);
  }

  private async findOwnedSchedule(userId: string, scheduleId: string) {
    const schedule = await this.scheduleRepository.findOne({
      where: { id: scheduleId, userId },
    });

    if (!schedule) {
      throw new NotFoundException('Auto-deposit schedule not found');
    }

    return schedule;
  }

  private resolveNextRunAt(from: Date, frequency: AutoDepositFrequency): Date {
    const next = new Date(from);

    switch (frequency) {
      case AutoDepositFrequency.DAILY:
        next.setDate(next.getDate() + 1);
        break;
      case AutoDepositFrequency.WEEKLY:
        next.setDate(next.getDate() + 7);
        break;
      case AutoDepositFrequency.BI_WEEKLY:
        next.setDate(next.getDate() + 14);
        break;
      case AutoDepositFrequency.MONTHLY:
        next.setMonth(next.getMonth() + 1);
        break;
      default:
        next.setDate(next.getDate() + 1);
    }

    return next;
  }
}
