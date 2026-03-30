import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductComparisonService } from './product-comparison.service';
import { SavingsProduct } from '../entities/savings-product.entity';
import { SavingsGoal } from '../entities/savings-goal.entity';
import { SavingsProductPerformance } from '../entities/savings-product-performance.entity';

describe('ProductComparisonService', () => {
  let service: ProductComparisonService;

  const productRepo = {
    find: jest.fn(),
  };

  const goalRepo = {
    find: jest.fn(),
  };

  const performanceRepo = {
    find: jest.fn(),
  };

  const cacheManager = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductComparisonService,
        { provide: getRepositoryToken(SavingsProduct), useValue: productRepo },
        { provide: getRepositoryToken(SavingsGoal), useValue: goalRepo },
        {
          provide: getRepositoryToken(SavingsProductPerformance),
          useValue: performanceRepo,
        },
        { provide: CACHE_MANAGER, useValue: cacheManager },
      ],
    }).compile();

    service = module.get<ProductComparisonService>(ProductComparisonService);
    jest.clearAllMocks();
  });

  it('should compare products and produce a best option', async () => {
    cacheManager.get.mockResolvedValue(undefined);
    productRepo.find.mockResolvedValue([
      {
        id: 'p1',
        name: 'Alpha',
        interestRate: 12,
        tenureMonths: 12,
        riskLevel: 'LOW',
      },
      {
        id: 'p2',
        name: 'Beta',
        interestRate: 8,
        tenureMonths: 6,
        riskLevel: 'MEDIUM',
      },
    ]);
    goalRepo.find.mockResolvedValue([{ targetAmount: 5000 }]);
    performanceRepo.find.mockResolvedValue([]);

    const result = await service.compareProducts('user-1', ['p1', 'p2']);

    expect(result.comparedProducts).toHaveLength(2);
    expect(result.bestOption).toHaveProperty('productId');
    expect(cacheManager.set).toHaveBeenCalled();
  });
});
