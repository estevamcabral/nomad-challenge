import { Test, TestingModule } from '@nestjs/testing';
import { StatisticsController } from '../statistics.controller';
import { StatisticsService } from '../statistics.service';

describe('StatisticsController', () => {
  let controller: StatisticsController;

  const serviceMock = {
    getMatchRanking: jest.fn(),
    getPreferredWeaponOfWinner: jest.fn(),
    getLongestKillStreak: jest.fn(),
    getGlobalRanking: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StatisticsController],
      providers: [
        {
          provide: StatisticsService,
          useValue: serviceMock,
        },
      ],
    }).compile();

    controller = module.get<StatisticsController>(StatisticsController);
    jest.clearAllMocks();
  });

  describe('getMatchRankingByMatch', () => {
    it('chama service com paginação convertida a partir da query', async () => {
      serviceMock.getMatchRanking.mockResolvedValue([
        { playerName: 'A', totalKills: 1, totalDeaths: 0 },
      ]);

      const result = await controller.getMatchRankingByMatch(123);

      expect(serviceMock.getMatchRanking).toHaveBeenCalledWith(123);
      expect(result).toEqual([
        { playerName: 'A', totalKills: 1, totalDeaths: 0 },
      ]);
    });
  });

  describe('getPreferredWeaponOfWinnerByMatch', () => {
    it('chama service com matchId', async () => {
      serviceMock.getPreferredWeaponOfWinner.mockResolvedValue({
        preferredWeapon: 'RocketLauncher',
        weaponUsageCount: 7,
        winnerName: 'Alice',
      });

      const result = await controller.getPreferredWeaponOfWinnerByMatch(77);

      expect(serviceMock.getPreferredWeaponOfWinner).toHaveBeenCalledWith(77);
      expect(result).toEqual({
        preferredWeapon: 'RocketLauncher',
        weaponUsageCount: 7,
        winnerName: 'Alice',
      });
    });
  });

  describe('getLongestKillStreak', () => {
    it('chama service com matchId', async () => {
      serviceMock.getLongestKillStreak.mockResolvedValue(null);

      const result = await controller.getLongestKillStreak(88);

      expect(serviceMock.getLongestKillStreak).toHaveBeenCalledWith(88);
      expect(result).toBeNull();
    });
  });

  describe('getGlobalRanking', () => {
    it('chama service com paginação convertida a partir da query', async () => {
      serviceMock.getGlobalRanking.mockResolvedValue([
        { playerName: 'A', totalKills: 10, totalDeaths: 5 },
      ]);

      const result = await controller.getGlobalRanking('3', '15');

      expect(serviceMock.getGlobalRanking).toHaveBeenCalledWith({
        pageNumber: 3,
        size: 15,
      });
      expect(result).toEqual([
        { playerName: 'A', totalKills: 10, totalDeaths: 5 },
      ]);
    });

    it('usa defaults quando query não é passada', async () => {
      serviceMock.getGlobalRanking.mockResolvedValue([]);

      await controller.getGlobalRanking(undefined, undefined);

      expect(serviceMock.getGlobalRanking).toHaveBeenCalledWith({
        pageNumber: 0,
        size: 100,
      });
    });
  });
});
