import { Global, Module } from '@nestjs/common';
import { Queue } from 'bullmq';
import Redis from 'ioredis';

@Global()
@Module({
  providers: [
    {
      provide: 'BULLMQ_CONNECTION',
      useFactory: () =>
        new Redis({
          host: '127.0.0.1',
          port: 6379,
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
        }),
    },
    {
      provide: 'BULLMQ_QUEUE',
      useFactory: (connection: Redis) =>
        new Queue('events', {
          connection,
          defaultJobOptions: {
            removeOnComplete: true,
            removeOnFail: { age: 3600 },
          },
        }),
      inject: ['BULLMQ_CONNECTION'],
    },
    {
      provide: 'CACHE_REDIS',
      useFactory: (connection: Redis) => connection,
      inject: ['BULLMQ_CONNECTION'],
    },
  ],
  exports: ['BULLMQ_CONNECTION', 'BULLMQ_QUEUE', 'CACHE_REDIS'],
})
export class RedisModule {}
