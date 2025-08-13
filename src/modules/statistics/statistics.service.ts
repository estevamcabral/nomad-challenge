import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MatchParticipation } from '../match-participation/match-participation.entity';
import { Kill } from '../kill/kill.entity';
import { Match } from '../match/match.entity';
import {
  LongestStreakResult,
  MatchRankingResult,
  PaginationParams,
  PreferredWeaponResult,
} from './statistics.inferface';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(MatchParticipation)
    private readonly participationRepository: Repository<MatchParticipation>,
    @InjectRepository(Kill)
    private readonly killRepository: Repository<Kill>,
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
  ) {}

  async getMatchRanking(matchId: number): Promise<MatchRankingResult[]> {
    const query = this.participationRepository
      .createQueryBuilder('participation')
      .leftJoinAndSelect('participation.player', 'player')
      .leftJoinAndSelect('participation.match', 'match')
      .orderBy('participation.totalKills', 'DESC')
      .where('match.id = :matchId', { matchId });

    const participations = await query.getMany();

    return participations.map((participation) => ({
      playerName: participation.player.name,
      totalKills: participation.totalKills,
      totalDeaths: participation.totalDeaths,
    }));
  }

  async getPreferredWeaponOfWinner(
    matchId: number,
  ): Promise<PreferredWeaponResult> {
    const winner = await this.participationRepository
      .createQueryBuilder('participation')
      .leftJoinAndSelect('participation.player', 'player')
      .leftJoinAndSelect('participation.match', 'match')
      .where('match.id = :matchId', { matchId })
      .orderBy('participation.totalKills', 'DESC')
      .addOrderBy('participation.totalDeaths', 'ASC')
      .take(1)
      .getOne();

    if (!winner) {
      return {} as PreferredWeaponResult;
    }

    const row = await this.killRepository
      .createQueryBuilder('kill')
      .innerJoin('kill.killer', 'killer')
      .innerJoin('kill.match', 'match')
      .where('match.id = :matchId', { matchId })
      .andWhere('killer.name = :killerName', { killerName: winner.player.name })
      .select('kill.weapon', 'weapon')
      .addSelect('COUNT(kill.id)', 'useCount')
      .groupBy('kill.weapon')
      .orderBy('COUNT(kill.id)', 'DESC')
      .addOrderBy('weapon', 'ASC')
      .take(1)
      .getRawOne<{
        weapon: string;
        useCount: string;
      }>();

    return {
      preferredWeapon: row.weapon,
      weaponUsageCount: Number(row.useCount),
      winnerName: winner.player.name,
    };
  }

  async getGlobalRanking(
    pagination: PaginationParams,
  ): Promise<MatchRankingResult[]> {
    const { pageNumber, size } = pagination;

    const rows = await this.participationRepository
      .createQueryBuilder('participation')
      .innerJoin('participation.player', 'player')
      .select('player.name', 'playerName')
      .addSelect('SUM(participation.totalKills)', 'totalKills')
      .addSelect('SUM(participation.totalDeaths)', 'totalDeaths')
      .groupBy('player.name')
      .orderBy('SUM(participation.totalKills)', 'DESC')
      .addOrderBy('SUM(participation.totalDeaths)', 'ASC')
      .addOrderBy('player.name', 'ASC')
      .offset(pageNumber * size)
      .limit(size)
      .getRawMany<{
        playerName: string;
        totalKills: string | number;
        totalDeaths: string | number;
      }>();

    return rows.map((r) => ({
      playerName: r.playerName,
      totalKills: Number(r.totalKills),
      totalDeaths: Number(r.totalDeaths),
    }));
  }

  async getLongestKillStreak(matchId: number): Promise<LongestStreakResult> {
    const kills = await this.killRepository.find({
      where: { match: { id: matchId } as any },
      order: { timestamp: 'ASC' },
    });

    if (!kills.length) {
      return {} as LongestStreakResult;
    }

    const currentStreak = new Map<string, number>();

    let maxStreak = 0;
    let maxPlayer = '';

    for (const k of kills) {
      const killerName = k.killer.name;
      const victimName = k.victim.name;

      if (killerName && killerName !== '<WORLD>') {
        const next = (currentStreak.get(killerName) ?? 0) + 1;
        currentStreak.set(killerName, next);

        if (next > maxStreak) {
          maxStreak = next;
          maxPlayer = killerName;
        }
      }

      if (victimName) {
        currentStreak.set(victimName, 0);
      }
    }

    return {
      playerName: maxPlayer,
      longestStreak: maxStreak,
    };
  }
}
