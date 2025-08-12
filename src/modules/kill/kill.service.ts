import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Kill } from './kill.entity';
import { KillEvent } from '../event/event.interface';
import { MatchService } from '../match/match.service';
import { PlayerService } from '../player/player.service';
import { MatchParticipationService } from '../match-participation/match-participation.service';

@Injectable()
export class KillService {
  private readonly logger = new Logger(KillService.name);

  constructor(
    @InjectRepository(Kill)
    private killRepository: Repository<Kill>,
    private matchService: MatchService,
    private playerService: PlayerService,
    private matchParticipationService: MatchParticipationService,
  ) {}

  async handleKill(event: KillEvent) {
    if (event.killer === '<WORLD>') {
      this.logger.warn(`World kill: ${event.killer}`);
      return;
    }

    const matchId = await this.matchService.getLastMatchCreatedId();
    const match = await this.matchService.findMatchById(matchId);

    if (!match) {
      this.logger.warn(`Match not found: ${matchId}`);
      return;
    }

    const [killer, victim] = await Promise.all([
      this.playerService.findOrCreatePlayer(event.killer),
      this.playerService.findOrCreatePlayer(event.victim),
    ]);

    const kill = this.killRepository.create({
      timestamp: event.timestamp,
      match,
      killer,
      victim,
      weapon: event.weapon,
    });

    await Promise.all([
      this.matchParticipationService.associatePlayerToMatch(killer, match),
      this.matchParticipationService.associatePlayerToMatch(victim, match),
    ]);

    await Promise.all([
      this.matchParticipationService.incrementKills(killer, match),
      this.matchParticipationService.incrementDeaths(victim, match),
      this.killRepository.save(kill),
    ]);
  }
}
