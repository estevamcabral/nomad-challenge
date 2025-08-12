import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';
import { MatchParticipation } from '../match-participation/match-participation.entity';
import { Kill } from '../kill/kill.entity';
import { Match } from '../match/match.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([MatchParticipation, Kill, Match]),
  ],
  controllers: [StatisticsController],
  providers: [StatisticsService],
  exports: [StatisticsService],
})
export class StatisticsModule {}