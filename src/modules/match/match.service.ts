import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from './match.entity';
import { MatchEnded, MatchStarted } from '../event/event.interface';
import Redis from 'ioredis';

@Injectable()
export class MatchService {
  private readonly logger = new Logger(MatchService.name);

  constructor(
    @InjectRepository(Match)
    private matchRepository: Repository<Match>,
    @Inject('CACHE_REDIS')
    private cache: Redis,
  ) {}

  async setLastMatchCreatedId(id: number) {
    await this.cache.set('lastMatchCreatedId', id.toString());
  }

  async getLastMatchCreatedId(): Promise<number | null> {
    const value = await this.cache.get('lastMatchCreatedId');
    return value ? parseInt(value, 10) : null;
  }

  async findMatchById(id: number): Promise<Match | null> {
    return this.matchRepository.findOne({ where: { id } });
  }

  async createMatch(event: MatchStarted) {
    const matchId = event.matchId;

    const createdMatch = await this.findMatchById(matchId);

    if (createdMatch) {
      this.logger.warn(`Match already exists: ${matchId}`);
      return;
    }

    const match = this.matchRepository.create({
      id: matchId,
      startedAt: event.timestamp,
    });

    await this.matchRepository.save(match);
    await this.setLastMatchCreatedId(matchId);
  }

  async endMatch(event: MatchEnded) {
    const matchId = event.matchId;

    const match = await this.findMatchById(matchId);
    if (!match) {
      this.logger.warn(`Match not found: ${matchId}`);
      return;
    }

    match.endedAt = event.timestamp;
    await this.matchRepository.save(match);
  }
}

export class MatchFullError extends Error {
  constructor(matchId: number) {
    super(`Match ${matchId} is full`);
    this.name = 'MatchFullError';
  }
}
