import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  private isCrashing = false;

  getRecommendations(userId: string): any {
    if (this.isCrashing) {
      throw new Error('Service is simulating a crash');
    }

    const recommendations = [
      { id: 1, title: 'Stranger Things', genre: 'Sci-Fi, Action', rating: 8.7 },
      { id: 2, title: 'The Crown', genre: 'Drama, History', rating: 8.6 },
      { id: 3, title: 'Dark', genre: 'Sci-Fi, Thriller', rating: 8.8 },
      { id: 4, title: 'Breaking Bad', genre: 'Crime, Drama', rating: 9.5 },
      { id: 5, title: 'The Witcher', genre: 'Fantasy, Action', rating: 8.2 },
    ];

    return {
      userId,
      source: 'recommendation-service',
      recommendations,
      timestamp: new Date().toISOString(),
    };
  }

  setCrashState(shouldCrash: boolean): { status: string; isCrashing: boolean } {
    this.isCrashing = shouldCrash;
    console.log(`Crash simulation ${shouldCrash ? 'ENABLED' : 'DISABLED'}`);
    return {
      status: shouldCrash ? 'Service will crash on next request' : 'Service is healthy',
      isCrashing: this.isCrashing,
    };
  }

  getHealthStatus(): { status: string; isCrashing: boolean } {
    return {
      status: this.isCrashing ? 'unhealthy' : 'healthy',
      isCrashing: this.isCrashing,
    };
  }
}
