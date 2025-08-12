import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Player } from '../player/player.entity';
import { Match } from '../match/match.entity';

@Entity({ name: 'match_participations' })
@Unique(['player', 'match'])
export class MatchParticipation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @ManyToOne(() => Player, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'player_name', referencedColumnName: 'name' })
  player: Player;

  @Index()
  @ManyToOne(() => Match, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'match_id' })
  match: Match;

  @Column({ type: 'int', default: 0 })
  totalKills: number;

  @Column({ type: 'int', default: 0 })
  totalDeaths: number;
}
