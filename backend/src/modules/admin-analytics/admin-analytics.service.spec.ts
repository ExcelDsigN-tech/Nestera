import { Test, TestingModule } from '@nestjs/testing';
import { AdminAnalyticsService } from './admin-analytics.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MedicalClaim } from '../claims/entities/medical-claim.entity';
import { Dispute } from '../disputes/entities/dispute.entity';
import { SavingsProduct } from '../savings/entities/savings-product.entity';
import { ProtocolMetrics } from './entities/protocol-metrics.entity';
import { OracleService } from './services/oracle.service';
import { SavingsService } from '../blockchain/savings.service';
import { User } from '../user/entities/user.entity';
import { UserSubscription } from '../savings/entities/user-subscription.entity';
import { Transaction } from '../transactions/entities/transaction.entity';

describe('AdminAnalyticsService', () => {
  let service: AdminAnalyticsService;

  const mockClaimRepository = {
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      getRawOne: jest.fn(),
    })),
  };

  const mockDisputeRepository = {
    count: jest.fn(),
  };

  const mockSavingsProductRepository = {
    find: jest.fn(),
  };

  const mockProtocolMetricsRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockUserRepository = {
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
    })),
  };

  const mockSubscriptionRepository = {
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
      getRawOne: jest.fn().mockResolvedValue({ total: '0' }),
    })),
  };

  const mockTransactionRepository = {
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
      getRawOne: jest.fn().mockResolvedValue({ total: '0' }),
    })),
  };

  const mockOracleService = {
    getAssetPrice: jest.fn(),
  };

  const mockSavingsService = {
    getVaultTotalAssets: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminAnalyticsService,
        {
          provide: getRepositoryToken(MedicalClaim),
          useValue: mockClaimRepository,
        },
        {
          provide: getRepositoryToken(Dispute),
          useValue: mockDisputeRepository,
        },
        {
          provide: getRepositoryToken(SavingsProduct),
          useValue: mockSavingsProductRepository,
        },
        {
          provide: getRepositoryToken(ProtocolMetrics),
          useValue: mockProtocolMetricsRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(UserSubscription),
          useValue: mockSubscriptionRepository,
        },
        {
          provide: getRepositoryToken(Transaction),
          useValue: mockTransactionRepository,
        },
        {
          provide: OracleService,
          useValue: mockOracleService,
        },
        {
          provide: SavingsService,
          useValue: mockSavingsService,
        },
      ],
    }).compile();

    service = module.get<AdminAnalyticsService>(AdminAnalyticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOverview', () => {
    it('should return analytics overview', async () => {
      const queryBuilder = {
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total: '50000' }),
      };

      mockClaimRepository.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(20)
        .mockResolvedValueOnce(150);
      mockDisputeRepository.count.mockResolvedValue(10);
      mockClaimRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.getOverview();

      expect(result).toHaveProperty('totalProcessedSweeps', 100);
      expect(result).toHaveProperty('activeDisputes', 10);
      expect(result).toHaveProperty('pendingMedicalClaims', 20);
      expect(result.totalClaimAmount).toBe(50000);
    });
  });
});
