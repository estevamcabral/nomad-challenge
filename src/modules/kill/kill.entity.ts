import {
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Match } from '../match/match.entity';
import { Player } from '../player/player.entity';

@Entity()
export class Kill {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @ManyToOne(() => Match)
  match: Match;

  @Index()
  @ManyToOne(() => Player, { eager: true })
  killer: Player;

  @ManyToOne(() => Player, { eager: true })
  victim: Player;

  @Column({ nullable: true })
  weapon?: string;
}
