import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Kill } from './kill.entity';
import { KillService } from './kill.service';
import { MatchModule } from '../match/match.module';
import { PlayerModule } from '../player/player.module';
import { MatchParticipationModule } from '../match-participation/match-participation.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Kill]),
    MatchModule,
    PlayerModule,
    MatchParticipationModule,
  ],
  providers: [KillService],
  exports: [KillService],
})
export class KillModule {}
