import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MatchParticipation } from './match-participation.entity';
import { MatchParticipationService } from './match-participation.service';
import { Player } from '../player/player.entity';
import { Match } from '../match/match.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MatchParticipation, Player, Match])],
  providers: [MatchParticipationService],
  exports: [MatchParticipationService],
})
export class MatchParticipationModule {}
