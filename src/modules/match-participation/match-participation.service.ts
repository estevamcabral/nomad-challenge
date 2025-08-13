import { Player } from '../player/player.entity';
import { Match, MAX_NUMBER_OF_PLAYERS } from '../match/match.entity';
import { MatchParticipation } from './match-participation.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { MatchFullError } from '../match/match.service';

@Injectable()
export class MatchParticipationService {
  private readonly logger = new Logger(MatchParticipationService.name);

  constructor(
    @InjectRepository(MatchParticipation)
    private readonly participationRepository: Repository<MatchParticipation>,
  ) {}

  async associatePlayerToMatch(
    player: Player,
    match: Match,
  ): Promise<MatchParticipation> {
    let participation = await this.participationRepository.findOne({
      where: { player: { name: player.name }, match: { id: match.id } },
      relations: ['player', 'match'],
    });

    if (participation) return participation;

    const numberOfParticipants = await this.participationRepository.count({
      where: {
        match: { id: match.id },
      },
    });

    if (numberOfParticipants === MAX_NUMBER_OF_PLAYERS) {
      throw new MatchFullError(match.id);
    }

    participation = this.participationRepository.create({
      player,
      match,
      totalKills: 0,
      totalDeaths: 0,
    });

    this.logger.log(
      `Criando participação: player=${player.name}, match=${match.id}`,
    );

    return this.participationRepository.save(participation);
  }

  async incrementKills(
    player: Player,
    match: Match,
    killsDelta = 1,
  ): Promise<MatchParticipation> {
    const participation = await this.participationRepository.findOne({
      where: { player: { name: player.name }, match: { id: match.id } },
      relations: ['player', 'match'],
    });

    if (!participation) {
      this.logger.error('Participation not found');
    }

    participation.totalKills += killsDelta;
    this.logger.log(
      `Atualizando kills: player=${player.name}, match=${match.id}, totalKills=${participation.totalKills}`,
    );

    return this.participationRepository.save(participation);
  }

  async incrementDeaths(
    player: Player,
    match: Match,
    deathsDelta = 1,
  ): Promise<MatchParticipation> {
    const participation = await this.participationRepository.findOne({
      where: { player: { name: player.name }, match: { id: match.id } },
      relations: ['player', 'match'],
    });

    if (!participation) {
      this.logger.error('Participation not found');
    }

    participation.totalDeaths += deathsDelta;
    this.logger.log(
      `Atualizando deaths: player=${player.name}, match=${match.id}, totalDeaths=${participation.totalDeaths}`,
    );

    return this.participationRepository.save(participation);
  }
}
