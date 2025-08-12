import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Worker } from 'bullmq';
import Redis from 'ioredis';
import {
  Event,
  EventType,
  KillEvent,
  MatchEnded,
  MatchStarted,
} from './event.interface';
import { MatchService } from '../match/match.service';
import { KillService } from '../kill/kill.service';

@Injectable()
export class EventConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventConsumerService.name);
  private worker: Worker | null = null;

  constructor(
    @Inject('BULLMQ_CONNECTION') private readonly connection: Redis,
    private matchesService: MatchService,
    private killService: KillService,
  ) {}

  onModuleInit() {
    this.worker = new Worker(
      'events',
      async (job) => {
        this.logger.log(`Processing event: ${JSON.stringify(job.data)}`);
        await this.dispatchEvent(job.data);
      },
      { connection: this.connection },
    );
  }

  async onModuleDestroy() {
    await this.worker?.close();
  }

  async dispatchEvent(event: Event) {
    switch (event.type) {
      case EventType.MATCH_STARTED:
        await this.matchesService.createMatch(event as MatchStarted);
        break;
      case EventType.KILL:
        await this.killService.handleKill(event as KillEvent);
        break;
      case EventType.MATCH_ENDED:
        await this.matchesService.endMatch(event as MatchEnded);
        break;
      default:
        this.logger.warn(`Unknown event type: ${event.type}`);
    }
  }
}
