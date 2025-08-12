import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match } from '../../modules/match/match.entity';
import { Player } from '../../modules/player/player.entity';
import { Kill } from '../../modules/kill/kill.entity';
import { MatchParticipation } from '../../modules/match-participation/match-participation.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: '127.0.0.1',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      database: 'postgres',
      entities: [Match, Player, Kill, MatchParticipation],
      synchronize: true,
    }),
  ],
  exports: [TypeOrmModule],
})
export class PostgresModule {}
