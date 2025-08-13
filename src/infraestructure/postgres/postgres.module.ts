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
      host: process.env.DATABASE_HOST || 'postgres',
      port: parseInt(process.env.DATABASE_PORT || '5432', 10),
      username: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres',
      database: process.env.DATABASE_NAME || 'nomad-challenge',
      entities: [Match, Player, Kill, MatchParticipation],
      synchronize: true,
    }),
  ],
  exports: [TypeOrmModule],
})
export class PostgresModule {}
