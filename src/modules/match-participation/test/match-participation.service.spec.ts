import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MatchParticipationService } from '../match-participation.service';
import { MatchParticipation } from '../match-participation.entity';
import { MAX_NUMBER_OF_PLAYERS } from '../../match/match.entity';
import { MatchFullError } from '../../match/match.service';

describe('MatchParticipationService', () => {
  let service: MatchParticipationService;
  let repo: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    count: jest.Mock;
  };

  const player = { id: 'p1', name: 'Alice' } as any;
  const match = { id: 101 } as any;

  beforeEach(async () => {
    repo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      count: jest.fn().mockResolvedValue(0), // default para não interferir em outros testes
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchParticipationService,
        {
          provide: getRepositoryToken(MatchParticipation),
          useValue: repo as unknown as Repository<MatchParticipation>,
        },
      ],
    }).compile();

    service = module.get(MatchParticipationService);

    // Silenciar logs
    (service as any).logger = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('associatePlayerToMatch', () => {
    it('retorna participação existente sem criar nova', async () => {
      const existing = {
        id: 'mp-1',
        player,
        match,
        totalKills: 3,
        totalDeaths: 2,
      } as any;

      repo.findOne.mockResolvedValue(existing);

      const result = await service.associatePlayerToMatch(player, match);

      expect(repo.findOne).toHaveBeenCalledWith({
        where: { player: { name: player.name }, match: { id: match.id } },
        relations: ['player', 'match'],
      });
      expect(result).toBe(existing);
      expect(repo.create).not.toHaveBeenCalled();
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('lança MatchFullError quando número de participantes atinge o limite', async () => {
      repo.findOne.mockResolvedValue(null);
      repo.count.mockResolvedValue(MAX_NUMBER_OF_PLAYERS);

      await expect(
        service.associatePlayerToMatch(player, match),
      ).rejects.toBeInstanceOf(MatchFullError);

      expect(repo.count).toHaveBeenCalledWith({
        where: { match: { id: match.id } },
      });
      expect(repo.create).not.toHaveBeenCalled();
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('cria e salva participação quando não existir e sala não estiver cheia', async () => {
      repo.findOne.mockResolvedValue(null);
      repo.count.mockResolvedValue(0);

      const created = {
        id: 'mp-new',
        player,
        match,
        totalKills: 0,
        totalDeaths: 0,
      } as any;

      repo.create.mockReturnValue(created);
      repo.save.mockResolvedValue(created);

      const result = await service.associatePlayerToMatch(player, match);

      expect(repo.create).toHaveBeenCalledWith({
        player,
        match,
        totalKills: 0,
        totalDeaths: 0,
      });
      expect(repo.save).toHaveBeenCalledWith(created);
      expect(result).toBe(created);
      expect((service as any).logger.log).toHaveBeenCalled();
    });
  });

  describe('incrementKills', () => {
    it('incrementa kills com delta padrão (1) e salva', async () => {
      const existing = {
        id: 'mp-1',
        player,
        match,
        totalKills: 5,
        totalDeaths: 2,
      } as any;

      repo.findOne.mockResolvedValue(existing);
      repo.save.mockImplementation(async (p: any) => p);

      const result = await service.incrementKills(player, match);

      expect(repo.findOne).toHaveBeenCalledWith({
        where: { player: { name: player.name }, match: { id: match.id } },
        relations: ['player', 'match'],
      });
      expect(existing.totalKills).toBe(6);
      expect(repo.save).toHaveBeenCalledWith(existing);
      expect(result).toBe(existing);
      expect((service as any).logger.log).toHaveBeenCalled();
    });

    it('incrementa kills com delta customizado e salva', async () => {
      const existing = {
        id: 'mp-2',
        player,
        match,
        totalKills: 1,
        totalDeaths: 0,
      } as any;

      repo.findOne.mockResolvedValue(existing);
      repo.save.mockImplementation(async (p: any) => p);

      const result = await service.incrementKills(player, match, 3);

      expect(existing.totalKills).toBe(4);
      expect(repo.save).toHaveBeenCalledWith(existing);
      expect(result).toBe(existing);
    });

    it('loga erro e rejeita quando participação não for encontrada', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.incrementKills(player, match)).rejects.toBeDefined();

      expect((service as any).logger.error).toHaveBeenCalledWith(
        'Participation not found',
      );
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  describe('incrementDeaths', () => {
    it('incrementa deaths com delta padrão (1) e salva', async () => {
      const existing = {
        id: 'mp-3',
        player,
        match,
        totalKills: 0,
        totalDeaths: 4,
      } as any;

      repo.findOne.mockResolvedValue(existing);
      repo.save.mockImplementation(async (p: any) => p);

      const result = await service.incrementDeaths(player, match);

      expect(existing.totalDeaths).toBe(5);
      expect(repo.save).toHaveBeenCalledWith(existing);
      expect(result).toBe(existing);
      expect((service as any).logger.log).toHaveBeenCalled();
    });

    it('incrementa deaths com delta customizado e salva', async () => {
      const existing = {
        id: 'mp-4',
        player,
        match,
        totalKills: 2,
        totalDeaths: 1,
      } as any;

      repo.findOne.mockResolvedValue(existing);
      repo.save.mockImplementation(async (p: any) => p);

      const result = await service.incrementDeaths(player, match, 2);

      expect(existing.totalDeaths).toBe(3);
      expect(repo.save).toHaveBeenCalledWith(existing);
      expect(result).toBe(existing);
    });

    it('loga erro e rejeita quando participação não for encontrada', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(
        service.incrementDeaths(player, match),
      ).rejects.toBeDefined();

      expect((service as any).logger.error).toHaveBeenCalledWith(
        'Participation not found',
      );
      expect(repo.save).not.toHaveBeenCalled();
    });
  });
});
