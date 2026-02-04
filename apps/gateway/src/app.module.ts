import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AppController } from './app.controller';
import { RecommendationService } from './recommendation.service';
import { DashboardController } from './dashboard.controller';
import { EventService } from './event.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'REC_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.REC_SERVICE_HOST || 'localhost',
          port: 3001,
        },
      },
    ]),
  ],
  controllers: [AppController, DashboardController],
  providers: [RecommendationService, EventService],
})
export class AppModule {}
