import {
    Injectable,
    ExecutionContext,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';

/**
 * RpcThrottleGuard - Specialized throttler for high-cost RPC operations
 *
 * This guard enforces strict rate limiting on endpoints that trigger live RPC calls
 * to Soroban/Horizon nodes. It uses User ID as the throttle key to prevent abuse
 * while allowing different users to operate independently.
 *
 * Configuration:
 * - GET /savings/my-subscriptions: 10 requests per minute per User ID
 * - Other RPC endpoints: configurable via decorator
 */
@Injectable()
export class RpcThrottleGuard extends ThrottlerGuard {
    private readonly logger = new Logger(RpcThrottleGuard.name);

    /**
     * Override getTracker to use User ID instead of IP address
     * This ensures rate limiting is per-user, not per-IP
     */
    protected async getTracker(req: Record<string, any>): Promise<string> {
        // Extract user ID from JWT token in request
        const user = req.user;

        if (!user || !user.id) {
            this.logger.warn(
                `RpcThrottleGuard: No user found in request to ${req.path}`,
            );
            // Fallback to IP if no user (shouldn't happen with JwtAuthGuard)
            return req.ip || 'unknown';
        }

        return `rpc-throttle:${user.id}`;
    }

    /**
     * Override onLimitExceeded to provide custom error response
     */
    async onLimitExceeded(
        context: ExecutionContext,
        limit: number,
        ttl: number,
    ): Promise<void> {
        const request = context.switchToHttp().getRequest<Request>();
        const user = (request as any).user;

        this.logger.warn(
            `RPC rate limit exceeded for user ${user?.id || 'unknown'} on ${request.method} ${request.path}. Limit: ${limit} requests per ${ttl}ms`,
        );

        throw new HttpException(
            `Too many RPC requests. Maximum ${limit} requests per ${Math.round(ttl / 1000)} seconds allowed.`,
            HttpStatus.TOO_MANY_REQUESTS,
        );
    }
}
