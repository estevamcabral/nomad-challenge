import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { PaginationParams } from './statistics.inferface';

@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('match-ranking/:matchId')
  async getMatchRankingByMatch(
    @Param('matchId', ParseIntPipe) matchId: number,
    @Query('pageNumber') pageNumber?: string,
    @Query('size') size?: string,
  ) {
    const pagination: PaginationParams = {
      pageNumber: pageNumber ? parseInt(pageNumber) : 0,
      size: size ? parseInt(size) : 100,
    };

    return this.statisticsService.getMatchRanking(matchId, pagination);
  }

  @Get('preferred-weapon/:matchId')
  async getPreferredWeaponOfWinnerByMatch(
    @Param('matchId', ParseIntPipe) matchId: number,
  ) {
    return this.statisticsService.getPreferredWeaponOfWinner(matchId);
  }

  @Get('longest-streak/:matchId')
  async getLongestKillStreak(@Param('matchId', ParseIntPipe) matchId: number) {
    return this.statisticsService.getLongestKillStreak(matchId);
  }

  @Get('/global-ranking')
  async getGlobalRanking(
    @Query('pageNumber') pageNumber?: string,
    @Query('size') size?: string,
  ) {
    const pagination: PaginationParams = {
      pageNumber: pageNumber ? parseInt(pageNumber) : 0,
      size: size ? parseInt(size) : 100,
    };

    return this.statisticsService.getGlobalRanking(pagination);
  }
}
