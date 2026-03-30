import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { SavingsProduct } from '../entities/savings-product.entity';
import { SavingsGoal } from '../entities/savings-goal.entity';
import { SavingsProductPerformance } from '../entities/savings-product-performance.entity';

interface ComparedProduct {
  id: string;
  name: string;
  apy: number;
  tenureMonths: number | null;
  risk: string;
  fees: number;
  projectedEarnings: number;
  historicalPerformance: Array<{
    apy: number;
    tvl: number;
    recordedAt: Date;
  }>;
}

@Injectable()
export class ProductComparisonService {
  constructor(
    @InjectRepository(SavingsProduct)
    private readonly productRepository: Repository<SavingsProduct>,
    @InjectRepository(SavingsGoal)
    private readonly goalRepository: Repository<SavingsGoal>,
    @InjectRepository(SavingsProductPerformance)
    private readonly performanceRepository: Repository<SavingsProductPerformance>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async compareProducts(userId: string, productIds: string[]) {
    const uniqueProductIds = [...new Set(productIds)];

    if (uniqueProductIds.length > 5) {
      throw new BadRequestException('You can compare up to 5 products at once');
    }

    const cacheKey = this.buildCacheKey(userId, uniqueProductIds);
    const cached = await this.cacheManager.get<any>(cacheKey);
    if (cached) {
      return { ...cached, cache: { hit: true, key: cacheKey } };
    }

    const products = await this.productRepository.find({
      where: { id: In(uniqueProductIds), isActive: true },
    });

    if (products.length !== uniqueProductIds.length) {
      throw new NotFoundException(
        'One or more savings products were not found',
      );
    }

    const goals = await this.goalRepository.find({ where: { userId } });
    const targetAmount = goals.length
      ? Math.max(...goals.map((goal) => Number(goal.targetAmount)))
      : 1000;

    const compared: ComparedProduct[] = [];

    for (const product of products) {
      const historical = await this.performanceRepository.find({
        where: { productId: product.id },
        order: { recordedAt: 'DESC' },
        take: 12,
      });

      const projectionMonths = product.tenureMonths ?? 12;
      const projectedEarnings = this.calculateProjectedEarnings(
        targetAmount,
        Number(product.interestRate),
        projectionMonths,
      );

      compared.push({
        id: product.id,
        name: product.name,
        apy: Number(product.interestRate),
        tenureMonths: product.tenureMonths ?? null,
        risk: product.riskLevel,
        fees: Number((product as any).fees ?? 0),
        projectedEarnings,
        historicalPerformance: historical.map((entry) => ({
          apy: Number(entry.apy),
          tvl: Number(entry.tvl),
          recordedAt: entry.recordedAt,
        })),
      });
    }

    const best = this.pickBestOption(compared, targetAmount);

    const response = {
      comparedProducts: compared,
      bestOption: best,
      criteria: {
        targetAmount,
        consideredSignals: ['apy', 'risk', 'fees', 'projection'],
      },
      cache: {
        hit: false,
        key: cacheKey,
      },
    };

    await this.cacheManager.set(cacheKey, response, 5 * 60 * 1000);

    return response;
  }

  private pickBestOption(compared: ComparedProduct[], targetAmount: number) {
    const scored = compared.map((product) => {
      const riskPenalty =
        product.risk === 'HIGH' ? 15 : product.risk === 'MEDIUM' ? 7 : 0;
      const feePenalty = product.fees;
      const projectionScore =
        product.projectedEarnings <= 0
          ? 0
          : (product.projectedEarnings / targetAmount) * 100;

      const score = product.apy + projectionScore - riskPenalty - feePenalty;
      return { product, score: Number(score.toFixed(2)) };
    });

    scored.sort((a, b) => b.score - a.score);
    const winner = scored[0];

    return {
      productId: winner.product.id,
      productName: winner.product.name,
      score: winner.score,
      reason: `Selected by weighted score across APY, risk, fees, and projected earnings.`,
    };
  }

  private calculateProjectedEarnings(
    principal: number,
    apy: number,
    months: number,
  ): number {
    const annualRate = apy / 100;
    const years = months / 12;
    const total = principal * Math.pow(1 + annualRate / 12, months);
    return Number((total - principal).toFixed(2));
  }

  private buildCacheKey(userId: string, productIds: string[]): string {
    const sorted = [...productIds].sort();
    return `savings:comparison:${userId}:${sorted.join(':')}`;
  }
}
