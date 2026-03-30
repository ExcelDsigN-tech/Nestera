import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AutoDepositService } from './auto-deposit.service';
import {
  AutoDepositFrequency,
  AutoDepositSchedule,
  AutoDepositStatus,
} from '../entities/auto-deposit-schedule.entity';
import { SavingsProduct } from '../entities/savings-product.entity';
import { User } from '../../user/entities/user.entity';
import { SavingsService as BlockchainSavingsService } from '../../blockchain/savings.service';
import { MailService } from '../../mail/mail.service';

describe('AutoDepositService', () => {
  let service: AutoDepositService;

  const scheduleRepo = {
    create: jest.fn((v) => v),
    save: jest.fn(async (v) => ({ id: 'sched-1', ...v })),
    find: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const productRepo = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
  };

  const userRepo = {
    findOne: jest.fn(),
  };

  const blockchainSavingsService = {
    invokeContractRead: jest.fn(),
  };

  const mailService = {
    sendRawMail: jest.fn(),
  };

  const eventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutoDepositService,
        {
          provide: getRepositoryToken(AutoDepositSchedule),
          useValue: scheduleRepo,
        },
        { provide: getRepositoryToken(SavingsProduct), useValue: productRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
        {
          provide: BlockchainSavingsService,
          useValue: blockchainSavingsService,
        },
        { provide: MailService, useValue: mailService },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get<AutoDepositService>(AutoDepositService);
    jest.clearAllMocks();
  });

  it('should create auto-deposit schedule', async () => {
    productRepo.findOne.mockResolvedValue({
      id: 'prod-1',
      minAmount: 10,
      isActive: true,
    });

    const created = await service.createSchedule('user-1', {
      productId: 'prod-1',
      amount: 100,
      frequency: AutoDepositFrequency.WEEKLY,
    });

    expect(created.status).toBe(AutoDepositStatus.ACTIVE);
    expect(scheduleRepo.save).toHaveBeenCalled();
  });

  it('should pause owned schedule', async () => {
    scheduleRepo.findOne.mockResolvedValue({
      id: 'sched-1',
      userId: 'user-1',
      status: AutoDepositStatus.ACTIVE,
    });

    const result = await service.pauseSchedule('user-1', 'sched-1');
    expect(result.status).toBe(AutoDepositStatus.PAUSED);
  });
});
