import { Test, TestingModule } from '@nestjs/testing';
import { StatisticsService } from '../statistics.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MatchParticipation } from '../../match-participation/match-participation.entity';
import { Kill } from '../../kill/kill.entity';
import { Match } from '../../match/match.entity';

type Qb = Record<string, jest.Mock>;

function createQb(): Qb {
  const qb: any = {};
  qb.leftJoinAndSelect = jest.fn().mockReturnValue(qb);
  qb.innerJoin = jest.fn().mockReturnValue(qb);
  qb.where = jest.fn().mockReturnValue(qb);
  qb.andWhere = jest.fn().mockReturnValue(qb);
  qb.orderBy = jest.fn().mockReturnValue(qb);
  qb.addOrderBy = jest.fn().mockReturnValue(qb);
  qb.groupBy = jest.fn().mockReturnValue(qb);
  qb.select = jest.fn().mockReturnValue(qb);
  qb.addSelect = jest.fn().mockReturnValue(qb);
  qb.skip = jest.fn().mockReturnValue(qb);
  qb.take = jest.fn().mockReturnValue(qb);
  // terminal methods (set per test)
  qb.getMany = jest.fn();
  qb.getOne = jest.fn();
  qb.getRawMany = jest.fn();
  qb.getRawOne = jest.fn();
  return qb as Qb;
}

describe('StatisticsService', () => {
  let service: StatisticsService;

  let participationRepo: jest.Mocked<Repository<MatchParticipation>>;
  let killRepo: jest.Mocked<Repository<Kill>>;
  let matchRepo: jest.Mocked<Repository<Match>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatisticsService,
        {
          provide: getRepositoryToken(MatchParticipation),
          useValue: {
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Kill),
          useValue: {
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Match),
          useValue: {
            createQueryBuilder: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<StatisticsService>(StatisticsService);
    participationRepo = module.get(getRepositoryToken(MatchParticipation));
    killRepo = module.get(getRepositoryToken(Kill));
    matchRepo = module.get(getRepositoryToken(Match));
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.useRealTimers();
  });

  describe('getMatchRanking', () => {
    it('retorna ranking da partida respeitando paginação', async () => {
      const qb = createQb();
      const matchId = 42;
      const pagination = { pageNumber: 2, size: 10 };

      const fakeParticipations: any[] = [
        {
          player: { name: 'Alice' },
          totalKills: 15,
          totalDeaths: 5,
        },
        {
          player: { name: 'Bob' },
          totalKills: 12,
          totalDeaths: 6,
        },
      ];

      qb.getMany.mockResolvedValue(fakeParticipations);
      (participationRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      const result = await service.getMatchRanking(matchId, pagination);

      expect(participationRepo.createQueryBuilder).toHaveBeenCalledWith(
        'participation',
      );
      expect(qb.leftJoinAndSelect).toHaveBeenCalledWith(
        'participation.player',
        'player',
      );
      expect(qb.leftJoinAndSelect).toHaveBeenCalledWith(
        'participation.match',
        'match',
      );
      expect(qb.orderBy).toHaveBeenCalledWith(
        'participation.totalKills',
        'DESC',
      );
      expect(qb.where).toHaveBeenCalledWith('match.id = :matchId', { matchId });
      expect(qb.skip).toHaveBeenCalledWith(
        pagination.pageNumber * pagination.size,
      );
      expect(qb.take).toHaveBeenCalledWith(pagination.size);

      expect(result).toEqual([
        { playerName: 'Alice', totalKills: 15, totalDeaths: 5 },
        { playerName: 'Bob', totalKills: 12, totalDeaths: 6 },
      ]);
    });

    it('usa paginação default quando não fornecida', async () => {
      const qb = createQb();
      qb.getMany.mockResolvedValue([]);
      (participationRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      await service.getMatchRanking(1, { pageNumber: 0, size: 100 });

      expect(qb.skip).toHaveBeenCalledWith(0);
      expect(qb.take).toHaveBeenCalledWith(100);
    });
  });

  describe('getPreferredWeaponOfWinner', () => {
    it('retorna arma preferida do vencedor', async () => {
      const qbWinner = createQb();
      const qbWeapon = createQb();

      (participationRepo.createQueryBuilder as jest.Mock).mockReturnValue(
        qbWinner,
      );
      (killRepo.createQueryBuilder as jest.Mock).mockReturnValue(qbWeapon);

      qbWinner.getOne.mockResolvedValue({
        player: { name: 'Alice' },
      } as any);

      qbWeapon.getRawOne.mockResolvedValue({
        weapon: 'RocketLauncher',
        useCount: 7,
      });

      const result = await service.getPreferredWeaponOfWinner(123);

      expect(participationRepo.createQueryBuilder).toHaveBeenCalledWith(
        'participation',
      );
      expect(qbWinner.orderBy).toHaveBeenCalledWith(
        'participation.totalKills',
        'DESC',
      );
      expect(qbWinner.addOrderBy).toHaveBeenCalledWith(
        'participation.totalDeaths',
        'ASC',
      );
      expect(qbWinner.take).toHaveBeenCalledWith(1);

      expect(killRepo.createQueryBuilder).toHaveBeenCalledWith('kill');
      expect(qbWeapon.innerJoin).toHaveBeenCalledWith('kill.killer', 'killer');
      expect(qbWeapon.innerJoin).toHaveBeenCalledWith('kill.match', 'match');
      expect(qbWeapon.where).toHaveBeenCalledWith('match.id = :matchId', {
        matchId: 123,
      });
      expect(qbWeapon.andWhere).toHaveBeenCalledWith(
        'killer.name = :killerName',
        { killerName: 'Alice' },
      );
      expect(qbWeapon.select).toHaveBeenCalledWith('kill.weapon', 'weapon');
      expect(qbWeapon.addSelect).toHaveBeenCalledWith(
        'COUNT(kill.id)',
        'useCount',
      );
      expect(qbWeapon.groupBy).toHaveBeenCalledWith('kill.weapon');
      expect(qbWeapon.orderBy).toHaveBeenCalledWith('COUNT(kill.id)', 'DESC');
      expect(qbWeapon.addOrderBy).toHaveBeenCalledWith('weapon', 'ASC');
      expect(qbWeapon.take).toHaveBeenCalledWith(1);

      expect(result).toEqual({
        preferredWeapon: 'RocketLauncher',
        weaponUsageCount: 7,
        winnerName: 'Alice',
      });
    });
  });

  describe('getGlobalRanking', () => {
    it('agrega kills/deaths por jogador e pagina', async () => {
      const qb = createQb();
      (participationRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      qb.getRawMany.mockResolvedValue([
        { playerName: 'Alice', totalKills: '30', totalDeaths: '10' },
        { playerName: 'Bob', totalKills: 25, totalDeaths: 15 },
      ]);

      const result = await service.getGlobalRanking({
        pageNumber: 1,
        size: 50,
      });

      expect(participationRepo.createQueryBuilder).toHaveBeenCalledWith(
        'participation',
      );
      expect(qb.innerJoin).toHaveBeenCalledWith(
        'participation.player',
        'player',
      );
      expect(qb.select).toHaveBeenCalledWith('player.name', 'playerName');
      expect(qb.addSelect).toHaveBeenCalledWith(
        'SUM(participation.totalKills)',
        'totalKills',
      );
      expect(qb.addSelect).toHaveBeenCalledWith(
        'SUM(participation.totalDeaths)',
        'totalDeaths',
      );
      expect(qb.groupBy).toHaveBeenCalledWith('player.name');
      expect(qb.orderBy).toHaveBeenCalledWith(
        'SUM(participation.totalKills)',
        'DESC',
      );
      expect(qb.addOrderBy).toHaveBeenCalledWith(
        'SUM(participation.totalDeaths)',
        'ASC',
      );
      expect(qb.addOrderBy).toHaveBeenCalledWith('player.name', 'ASC');
      expect(qb.skip).toHaveBeenCalledWith(1 * 50);
      expect(qb.take).toHaveBeenCalledWith(50);

      expect(result).toEqual([
        { playerName: 'Alice', totalKills: 30, totalDeaths: 10 },
        { playerName: 'Bob', totalKills: 25, totalDeaths: 15 },
      ]);
    });

    it('usa defaults quando paginação não informada', async () => {
      const qb = createQb();
      (participationRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);
      qb.getRawMany.mockResolvedValue([]);

      await service.getGlobalRanking({} as any);

      expect(qb.skip).toHaveBeenCalledWith(0);
      expect(qb.take).toHaveBeenCalledWith(100);
    });
  });

  describe('getLongestKillStreak', () => {
    it('retorna null (não implementado)', async () => {
      const result = await service.getLongestKillStreak(999);
      expect(result).toBeNull();
    });
  });
});
