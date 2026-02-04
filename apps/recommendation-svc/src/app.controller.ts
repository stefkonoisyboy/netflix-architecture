import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @MessagePattern({ cmd: 'get_rec' })
  getRecommendations(data: { userId: string }) {
    console.log(`Received request for user: ${data.userId}`);
    return this.appService.getRecommendations(data.userId);
  }

  @MessagePattern({ cmd: 'simulate_crash' })
  simulateCrash(data: { shouldCrash: boolean }) {
    return this.appService.setCrashState(data.shouldCrash);
  }

  @MessagePattern({ cmd: 'health' })
  getHealth() {
    return this.appService.getHealthStatus();
  }
}
