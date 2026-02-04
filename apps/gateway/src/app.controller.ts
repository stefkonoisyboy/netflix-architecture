import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { RecommendationService } from './recommendation.service';

@Controller()
export class AppController {
  constructor(private readonly recommendationService: RecommendationService) {}

  @Get('recommendations/user/:userId')
  async getRecommendations(@Param('userId') userId: string) {
    return this.recommendationService.getRecommendations(userId);
  }

  @Post('control/simulate-crash')
  async simulateCrash(@Body() body: { shouldCrash: boolean }) {
    return this.recommendationService.simulateCrash(body.shouldCrash);
  }

  @Get('control/health')
  async getHealth() {
    return this.recommendationService.getHealth();
  }

  @Get('control/circuit-breaker')
  getCircuitBreakerStats() {
    return this.recommendationService.getCircuitBreakerStats();
  }
}
