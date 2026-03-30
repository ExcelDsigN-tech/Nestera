import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, from, of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { CacheStrategyService } from '../../modules/cache/cache-strategy.service';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(private cacheStrategy: CacheStrategyService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, query } = request;

    // Only cache GET requests
    if (method !== 'GET') {
      return next.handle();
    }

    const cacheKey = `${url}:${JSON.stringify(query)}`;

    return from(this.cacheStrategy.get(cacheKey)).pipe(
      switchMap((cached) => {
        if (cached) {
          return of(cached);
        }

        return next.handle().pipe(
          tap((data) => {
            this.cacheStrategy.set(cacheKey, data);
          }),
        );
      }),
    );
  }
}
