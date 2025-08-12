import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class Match {
  @PrimaryColumn()
  id: number;

  @Column({ type: 'timestamp' })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  endedAt?: Date;
}
