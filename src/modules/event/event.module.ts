import { Module } from '@nestjs/common';
import { EventProducerService } from './event-producer.service';
import { RedisModule } from '../../infraestructure/redis/redis.module';
import { EventConsumerService } from './event-consumer.service';
import { MatchModule } from '../match/match.module';
import { KillModule } from '../kill/kill.module';

@Module({
  imports: [RedisModule, MatchModule, KillModule],
  providers: [EventProducerService, EventConsumerService],
  exports: [EventProducerService],
})
export class EventModule {}
