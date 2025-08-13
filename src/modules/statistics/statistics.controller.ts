import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { StatisticsService } from './statistics.service';
import { PaginationParams } from './statistics.inferface';

@ApiTags('statistics')
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('match-ranking/:matchId')
  @ApiOperation({
    summary: 'Get match ranking by match ID',
    description:
      'Returns player rankings for a specific match with pagination support',
  })
  @ApiParam({
    name: 'matchId',
    type: 'number',
    description: 'The ID of the match to get rankings for',
  })
  @ApiResponse({
    status: 200,
    description: 'Match ranking retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          playerName: { type: 'string' },
          totalKills: { type: 'number' },
          totalDeaths: { type: 'number' },
        },
      },
    },
  })
  async getMatchRankingByMatch(
    @Param('matchId', ParseIntPipe) matchId: number,
  ) {
    return this.statisticsService.getMatchRanking(matchId);
  }

  @Get('preferred-weapon/:matchId')
  @ApiOperation({
    summary: 'Get preferred weapon of match winner',
    description:
      'Returns the most used weapon by the winner of a specific match',
  })
  @ApiParam({
    name: 'matchId',
    type: 'number',
    description: "The ID of the match to get winner's preferred weapon for",
  })
  @ApiResponse({
    status: 200,
    description: 'Preferred weapon retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        winnerName: { type: 'string' },
        preferredWeapon: { type: 'string' },
        weaponUsageCount: { type: 'number' },
      },
    },
  })
  async getPreferredWeaponOfWinnerByMatch(
    @Param('matchId', ParseIntPipe) matchId: number,
  ) {
    return this.statisticsService.getPreferredWeaponOfWinner(matchId);
  }

  @Get('longest-streak/:matchId')
  @ApiOperation({
    summary: 'Get longest kill streak in match',
    description:
      'Returns the player with the longest kill streak in a specific match',
  })
  @ApiParam({
    name: 'matchId',
    type: 'number',
    description: 'The ID of the match to get longest kill streak for',
  })
  @ApiResponse({
    status: 200,
    description: 'Longest kill streak retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        playerName: { type: 'string' },
        longestStreak: { type: 'number' },
      },
    },
  })
  async getLongestKillStreak(@Param('matchId', ParseIntPipe) matchId: number) {
    return this.statisticsService.getLongestKillStreak(matchId);
  }

  @Get('/global-ranking')
  @ApiOperation({
    summary: 'Get global player ranking',
    description:
      'Returns global ranking of all players across all matches with pagination support',
  })
  @ApiQuery({
    name: 'pageNumber',
    type: 'string',
    required: false,
    description: 'Page number for pagination (default: 0)',
  })
  @ApiQuery({
    name: 'size',
    type: 'string',
    required: false,
    description: 'Number of results per page (default: 100)',
  })
  @ApiResponse({
    status: 200,
    description: 'Global ranking retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          playerName: { type: 'string' },
          totalKills: { type: 'number' },
          totalDeaths: { type: 'number' },
        },
      },
    },
  })
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
