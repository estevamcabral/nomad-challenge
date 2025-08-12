import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match } from './match.entity';
import { MatchService } from './match.service';
import { RedisModule } from '../../infraestructure/redis/redis.module';

@Module({
  imports: [TypeOrmModule.forFeature([Match]), RedisModule],
  providers: [MatchService],
  exports: [MatchService],
})
export class MatchModule {}
