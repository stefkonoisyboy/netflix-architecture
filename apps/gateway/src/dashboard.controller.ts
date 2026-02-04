import { Controller, Sse, MessageEvent } from '@nestjs/common';
import { Observable, interval } from 'rxjs';
import { map, merge } from 'rxjs/operators';
import { EventService } from './event.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly eventService: EventService) {}

  @Sse('stream')
  streamEvents(): Observable<MessageEvent> {
    return this.eventService.events$.pipe(
      map((event) => ({
        data: event,
      })),
    );
  }
}
