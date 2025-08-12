import { Module } from '@nestjs/common';
import { EventsProducerService } from './events-producer.service';
import { RedisQueueModule } from '../../infraestructure/redis/redis-queue.module';
import { EventsConsumerService } from './events-consumer.service';

@Module({
  imports: [RedisQueueModule],
  providers: [EventsProducerService, EventsConsumerService],
  exports: [EventsProducerService],
})
export class EventsModule {}
