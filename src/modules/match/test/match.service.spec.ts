import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MatchService } from '../match.service';
import { Match } from '../match.entity';

describe('MatchService', () => {
  let service: MatchService;

  let repo: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };

  let cache: {
    set: jest.Mock;
    get: jest.Mock;
  };

  beforeEach(async () => {
    repo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    cache = {
      set: jest.fn().mockResolvedValue(undefined),
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchService,
        {
          provide: getRepositoryToken(Match),
          useValue: repo as unknown as Repository<Match>,
        },
        {
          provide: 'CACHE_REDIS',
          useValue: cache,
        },
      ],
    }).compile();

    service = module.get(MatchService);

    (service as any).logger = {
      warn: jest.fn(),
      log: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('setLastMatchCreatedId', () => {
    it('deve salvar no cache como string', async () => {
      await service.setLastMatchCreatedId(12345);
      expect(cache.set).toHaveBeenCalledWith('lastMatchCreatedId', '12345');
    });
  });

  describe('getLastMatchCreatedId', () => {
    it('deve retornar número quando presente no cache', async () => {
      cache.get.mockResolvedValue('2001');
      await expect(service.getLastMatchCreatedId()).resolves.toBe(2001);
      expect(cache.get).toHaveBeenCalledWith('lastMatchCreatedId');
    });

    it('deve retornar null quando ausente no cache', async () => {
      cache.get.mockResolvedValue(null);
      await expect(service.getLastMatchCreatedId()).resolves.toBeNull();
    });
  });

  describe('findMatchById', () => {
    it('deve chamar repository.findOne com where:id', async () => {
      const match: Match = { id: 7, startedAt: new Date() } as Match;
      repo.findOne.mockResolvedValue(match);

      const result = await service.findMatchById(7);

      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 7 } });
      expect(result).toBe(match);
    });
  });

  describe('createMatch', () => {
    it('não deve criar se já existir e deve logar warn', async () => {
      const timestamp = new Date();
      const existing: Match = { id: 10, startedAt: timestamp } as Match;

      repo.findOne.mockResolvedValue(existing);

      await service.createMatch({ matchId: 10, timestamp } as any);

      expect((service as any).logger.warn).toHaveBeenCalledWith(
        'Match already exists: 10',
      );
      expect(repo.create).not.toHaveBeenCalled();
      expect(repo.save).not.toHaveBeenCalled();
      expect(cache.set).not.toHaveBeenCalled();
    });

    it('deve criar, salvar e registrar lastMatchCreatedId quando não existir', async () => {
      const timestamp = new Date();
      repo.findOne.mockResolvedValue(null);

      const created = { id: 20, startedAt: timestamp } as Match;
      repo.create.mockReturnValue(created);
      repo.save.mockResolvedValue(created);

      await service.createMatch({ matchId: 20, timestamp } as any);

      expect(repo.create).toHaveBeenCalledWith({
        id: 20,
        startedAt: timestamp,
      });
      expect(repo.save).toHaveBeenCalledWith(created);
      expect(cache.set).toHaveBeenCalledWith('lastMatchCreatedId', '20');
    });
  });

  describe('endMatch', () => {
    it('deve logar warn quando match não encontrado', async () => {
      repo.findOne.mockResolvedValue(null);

      await service.endMatch({ matchId: 33, timestamp: new Date() } as any);

      expect((service as any).logger.warn).toHaveBeenCalledWith(
        'Match not found: 33',
      );
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('deve atualizar endedAt e salvar quando encontrado', async () => {
      const startedAt = new Date('2024-01-01T12:00:00Z');
      const endedAt = new Date('2024-01-01T13:00:00Z');

      const match: Match = { id: 44, startedAt } as Match;
      repo.findOne.mockResolvedValue(match);
      repo.save.mockImplementation(async (m: any) => m);

      await service.endMatch({ matchId: 44, timestamp: endedAt } as any);

      expect(match.endedAt).toEqual(endedAt);
      expect(repo.save).toHaveBeenCalledWith(match);
    });
  });
});
