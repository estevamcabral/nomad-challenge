import { Inject, Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { Event } from './event.interface';

@Injectable()
export class EventProducerService {
  private readonly logger = new Logger(EventProducerService.name);

  constructor(@Inject('BULLMQ_QUEUE') private readonly queue: Queue) {}

  async addEvent(event: Event): Promise<void> {
    this.logger.log(`Adding event: ${JSON.stringify(event)}`);
    await this.queue.add('event', event);
  }
}
