import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';

export interface DashboardEvent {
  type: 'request' | 'circuit_breaker' | 'service_health' | 'log';
  timestamp: string;
  data: any;
}

@Injectable()
export class EventService {
  private eventSubject = new Subject<DashboardEvent>();

  get events$() {
    return this.eventSubject.asObservable();
  }

  emitEvent(event: DashboardEvent) {
    this.eventSubject.next(event);
  }

  emitRequestEvent(
    requestId: string,
    userId: string,
    status: 'success' | 'failed' | 'fallback',
    source: string,
    data?: any,
  ) {
    this.emitEvent({
      type: 'request',
      timestamp: new Date().toISOString(),
      data: {
        requestId,
        userId,
        status,
        source,
        endpoint: '/recommendations/user/' + userId,
        data,
      },
    });
  }

  emitCircuitBreakerEvent(state: string, failures: number, total: number) {
    this.emitEvent({
      type: 'circuit_breaker',
      timestamp: new Date().toISOString(),
      data: {
        state,
        failures,
        total,
      },
    });
  }

  emitServiceHealthEvent(service: string, status: 'online' | 'offline') {
    this.emitEvent({
      type: 'service_health',
      timestamp: new Date().toISOString(),
      data: {
        service,
        status,
      },
    });
  }

  emitLogEvent(message: string, level: 'info' | 'error' | 'warning') {
    this.emitEvent({
      type: 'log',
      timestamp: new Date().toISOString(),
      data: {
        message,
        level,
      },
    });
  }
}
