import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Match } from '../match/match.entity';
import { Player } from '../player/player.entity';

@Entity()
export class Kill {
  @PrimaryGeneratedColumn('uuid')
  id: number;

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @ManyToOne(() => Match)
  match: Match;

  @ManyToOne(() => Player, { eager: true })
  killer: Player;

  @ManyToOne(() => Player, { eager: true })
  victim: Player;

  @Column({ nullable: true })
  weapon?: string;
}
