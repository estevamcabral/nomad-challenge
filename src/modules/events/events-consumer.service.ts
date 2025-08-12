import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { EventType } from './events.interface';

@Injectable()
export class EventsConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventsConsumerService.name);
  private worker: Worker | null = null;

  constructor(
    @Inject('BULLMQ_CONNECTION') private readonly connection: Redis,
  ) {}

  onModuleInit() {
    this.worker = new Worker(
      'events',
      async (job) => {
        this.logger.log(`Processing event: ${JSON.stringify(job.data)}`);
        this.dispatchEvent(job.data);
      },
      { connection: this.connection },
    );
  }

  async onModuleDestroy() {
    await this.worker?.close();
  }

  private dispatchEvent(event: Event) {
    switch (event.type) {
      case EventType.MATCH_STARTED:
        console.log('MATCH_STARTED');
        break;
      case EventType.KILL:
        console.log('KILL');
        break;
      case EventType.MATCH_ENDED:
        console.log('MATCH_ENDED');
        break;
      default:
        this.logger.warn(`Unknown event type: ${event.type}`);
    }
  }
}
