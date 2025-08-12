import { Module, Global } from '@nestjs/common';
import { Queue } from 'bullmq';

@Global()
@Module({
  providers: [
    {
      provide: 'BULLMQ_QUEUE',
      useFactory: (): Queue => {
        return new Queue('events', {
          connection: {
            host: 'localhost',
            port: 6379,
          },
        });
      },
    },
  ],
  exports: ['BULLMQ_QUEUE'],
})
export class RedisModule {}
