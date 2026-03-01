import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import * as CircuitBreaker from 'opossum';
import { lastValueFrom } from 'rxjs';
import { EventService } from './event.service';

@Injectable()
export class RecommendationService implements OnModuleInit {
  private breaker: CircuitBreaker;

  constructor(
    @Inject('REC_SERVICE') private client: ClientProxy,
    private eventService: EventService,
  ) {
    const options = {
      timeout: 3000,
      errorThresholdPercentage: 50,
      resetTimeout: 10000,
      rollingCountTimeout: 10000,
      rollingCountBuckets: 10,
      name: 'recommendation-service',
    };

    const fire = (userId: string) =>
      lastValueFrom(this.client.send({ cmd: 'get_rec' }, { userId }));

    this.breaker = new CircuitBreaker(fire, options);

    this.breaker.fallback(() => ({
      userId: 'unknown',
      source: 'fallback-cache',
      recommendations: [
        { id: 1, title: 'Trending Now', genre: 'Popular', rating: 0 },
        { id: 2, title: 'Netflix Originals', genre: 'Original', rating: 0 },
      ],
      timestamp: new Date().toISOString(),
    }));

    this.breaker.on('open', () => {
      console.log('\n🔴 ========================================');
      console.log('🔴 CIRCUIT BREAKER OPENED - SERVICE DOWN');
      console.log('🔴 All requests will use FALLBACK');
      console.log('🔴 ========================================\n');
      this.eventService.emitCircuitBreakerEvent(
        'OPEN',
        this.breaker.stats.failures,
        this.breaker.stats.fires,
      );
      this.eventService.emitLogEvent(
        'Circuit Breaker opened - Service Down',
        'error',
      );
    });

    this.breaker.on('halfOpen', () => {
      console.log('\n🟡 ========================================');
      console.log('🟡 CIRCUIT BREAKER HALF-OPEN');
      console.log('🟡 Testing if service recovered...');
      console.log('🟡 ========================================\n');
      this.eventService.emitCircuitBreakerEvent(
        'HALF_OPEN',
        this.breaker.stats.failures,
        this.breaker.stats.fires,
      );
      this.eventService.emitLogEvent(
        'Circuit Breaker half-open - Testing service',
        'warning',
      );
    });

    this.breaker.on('close', () => {
      console.log('\n🟢 ========================================');
      console.log('🟢 CIRCUIT BREAKER CLOSED - SERVICE HEALTHY');
      console.log('🟢 Normal operation resumed');
      console.log('🟢 ========================================\n');
      this.eventService.emitCircuitBreakerEvent(
        'CLOSED',
        this.breaker.stats.failures,
        this.breaker.stats.fires,
      );
      this.eventService.emitLogEvent(
        'Circuit Breaker closed - Service Healthy',
        'info',
      );
    });

    this.breaker.on('success', (result) => {
      this.eventService.emitCircuitBreakerEvent(
        this.breaker.opened ? 'OPEN' : this.breaker.halfOpen ? 'HALF_OPEN' : 'CLOSED',
        this.breaker.stats.failures,
        this.breaker.stats.fires,
      );
    });

    this.breaker.on('failure', (error) => {
      const failureRate = ((this.breaker.stats.failures / this.breaker.stats.fires) * 100).toFixed(1);
      console.log(`❌ Request failed: ${error.message} (Failure rate: ${failureRate}%)`);
      this.eventService.emitCircuitBreakerEvent(
        this.breaker.opened ? 'OPEN' : this.breaker.halfOpen ? 'HALF_OPEN' : 'CLOSED',
        this.breaker.stats.failures,
        this.breaker.stats.fires,
      );
    });

    this.breaker.on('timeout', () => {
      this.eventService.emitCircuitBreakerEvent(
        this.breaker.opened ? 'OPEN' : this.breaker.halfOpen ? 'HALF_OPEN' : 'CLOSED',
        this.breaker.stats.failures,
        this.breaker.stats.fires,
      );
    });

    this.breaker.on('reject', () => {
      this.eventService.emitCircuitBreakerEvent(
        this.breaker.opened ? 'OPEN' : this.breaker.halfOpen ? 'HALF_OPEN' : 'CLOSED',
        this.breaker.stats.failures,
        this.breaker.stats.fires,
      );
    });

    this.breaker.on('fallback', () => {
      console.log('⚠️  Fallback triggered');
      this.eventService.emitCircuitBreakerEvent(
        this.breaker.opened ? 'OPEN' : this.breaker.halfOpen ? 'HALF_OPEN' : 'CLOSED',
        this.breaker.stats.failures,
        this.breaker.stats.fires,
      );
    });
  }

  async onModuleInit() {
    await this.client.connect();
    this.eventService.emitServiceHealthEvent('recommendation-svc', 'online');
    this.eventService.emitServiceHealthEvent('gateway', 'online');
  }

  async getRecommendations(userId: string) {
    const requestId = Math.random().toString(36).substring(7);
    
    try {
      const result = await this.breaker.fire(userId);
      
      if (result.source === 'fallback-cache') {
        this.eventService.emitRequestEvent(
          requestId,
          userId,
          'fallback',
          'Fallback: Trending Content',
          result,
        );
      } else {
        this.eventService.emitRequestEvent(
          requestId,
          userId,
          'success',
          'Personalized: Sci-Fi, Action',
          result,
        );
      }
      
      return result;
    } catch (error) {
      this.eventService.emitRequestEvent(
        requestId,
        userId,
        'failed',
        'Service Down',
      );
      throw error;
    }
  }

  async simulateCrash(shouldCrash: boolean) {
    return lastValueFrom(
      this.client.send({ cmd: 'simulate_crash' }, { shouldCrash }),
    );
  }

  async getHealth() {
    try {
      return await lastValueFrom(this.client.send({ cmd: 'health' }, {}));
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }

  getCircuitBreakerStats() {
    return {
      state: this.breaker.opened ? 'OPEN' : this.breaker.halfOpen ? 'HALF_OPEN' : 'CLOSED',
      failures: this.breaker.stats.failures,
      successes: this.breaker.stats.successes,
      fires: this.breaker.stats.fires,
      fallbacks: this.breaker.stats.fallbacks,
    };
  }
}
