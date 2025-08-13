import { Test, TestingModule } from '@nestjs/testing';
import { KillService } from '../kill.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Kill } from '../kill.entity';
import { Repository } from 'typeorm';
import { MatchFullError, MatchService } from '../../match/match.service';
import { PlayerService } from '../../player/player.service';
import { MatchParticipationService } from '../../match-participation/match-participation.service';

describe('KillService', () => {
  let service: KillService;

  let killRepository: {
    create: jest.Mock;
    save: jest.Mock;
  };

  let matchService: {
    getLastMatchCreatedId: jest.Mock;
    findMatchById: jest.Mock;
  };

  let playerService: {
    findOrCreatePlayer: jest.Mock;
  };

  let matchParticipationService: {
    associatePlayerToMatch: jest.Mock;
    incrementKills: jest.Mock;
    incrementDeaths: jest.Mock;
  };

  beforeEach(async () => {
    killRepository = {
      create: jest.fn(),
      save: jest.fn(),
    };

    matchService = {
      getLastMatchCreatedId: jest.fn(),
      findMatchById: jest.fn(),
    };

    playerService = {
      findOrCreatePlayer: jest.fn(),
    };

    matchParticipationService = {
      associatePlayerToMatch: jest.fn(),
      incrementKills: jest.fn(),
      incrementDeaths: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KillService,
        {
          provide: getRepositoryToken(Kill),
          useValue: killRepository as unknown as Repository<Kill>,
        },
        { provide: MatchService, useValue: matchService },
        { provide: PlayerService, useValue: playerService },
        {
          provide: MatchParticipationService,
          useValue: matchParticipationService,
        },
      ],
    }).compile();

    service = module.get(KillService);

    (service as any).logger = {
      warn: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve ignorar evento quando killer é <WORLD> e logar warn', async () => {
    const event = {
      type: 2,
      timestamp: new Date(),
      killer: '<WORLD>',
      victim: 'Alice',
      cause: 'FALL',
    } as any;

    await service.handleKill(event);

    expect((service as any).logger.warn).toHaveBeenCalledWith(
      'World kill: <WORLD>',
    );
    expect(matchService.getLastMatchCreatedId).not.toHaveBeenCalled();
    expect(killRepository.save).not.toHaveBeenCalled();
    expect(matchParticipationService.incrementKills).not.toHaveBeenCalled();
    expect(matchParticipationService.incrementDeaths).not.toHaveBeenCalled();
  });

  it('deve ignorar quando a partida não for encontrada e logar warn', async () => {
    const event = {
      type: 2,
      timestamp: new Date(),
      killer: 'Bob',
      victim: 'Alice',
      weapon: 'AK47',
    } as any;

    matchService.getLastMatchCreatedId.mockResolvedValue(123);
    matchService.findMatchById.mockResolvedValue(null);

    await service.handleKill(event);

    expect(matchService.getLastMatchCreatedId).toHaveBeenCalled();
    expect(matchService.findMatchById).toHaveBeenCalledWith(123);
    expect((service as any).logger.warn).toHaveBeenCalledWith(
      'Match not found: 123',
    );
    expect(playerService.findOrCreatePlayer).not.toHaveBeenCalled();
    expect(killRepository.save).not.toHaveBeenCalled();
  });

  it('deve processar kill normal: criar entidades, associar e atualizar estatísticas', async () => {
    const now = new Date();
    const event = {
      type: 2,
      timestamp: now,
      killer: 'Bob',
      victim: 'Alice',
      weapon: 'AK47',
    } as any;

    const match = { id: 999 };
    const killer = { id: 'player-bob', name: 'Bob' };
    const victim = { id: 'player-alice', name: 'Alice' };

    matchService.getLastMatchCreatedId.mockResolvedValue(999);
    matchService.findMatchById.mockResolvedValue(match);
    playerService.findOrCreatePlayer
      .mockResolvedValueOnce(killer) // killer
      .mockResolvedValueOnce(victim); // victim

    const createdKill = {
      id: 'kill-1',
      timestamp: now,
      match,
      killer,
      victim,
      weapon: 'AK47',
    };
    killRepository.create.mockReturnValue(createdKill);
    killRepository.save.mockResolvedValue({ ...createdKill, id: 'kill-1' });

    matchParticipationService.associatePlayerToMatch.mockResolvedValue(
      undefined,
    );
    matchParticipationService.incrementKills.mockResolvedValue(undefined);
    matchParticipationService.incrementDeaths.mockResolvedValue(undefined);

    await service.handleKill(event);

    expect(matchService.getLastMatchCreatedId).toHaveBeenCalledTimes(1);
    expect(matchService.findMatchById).toHaveBeenCalledWith(999);

    expect(playerService.findOrCreatePlayer).toHaveBeenNthCalledWith(1, 'Bob');
    expect(playerService.findOrCreatePlayer).toHaveBeenNthCalledWith(
      2,
      'Alice',
    );

    expect(killRepository.create).toHaveBeenCalledWith({
      timestamp: now,
      match,
      killer,
      victim,
      weapon: 'AK47',
    });

    expect(
      matchParticipationService.associatePlayerToMatch,
    ).toHaveBeenCalledWith(killer, match);
    expect(
      matchParticipationService.associatePlayerToMatch,
    ).toHaveBeenCalledWith(victim, match);

    expect(matchParticipationService.incrementKills).toHaveBeenCalledWith(
      killer,
      match,
    );
    expect(matchParticipationService.incrementDeaths).toHaveBeenCalledWith(
      victim,
      match,
    );
    expect(killRepository.save).toHaveBeenCalledWith(createdKill);
  });

  it('deve permitir weapon opcional (undefined) ao criar o kill', async () => {
    const now = new Date();
    const event = {
      type: 2,
      timestamp: now,
      killer: 'Carol',
      victim: 'Dave',
    } as any;

    const match = { id: 1 };
    const killer = { id: 'p1', name: 'Carol' };
    const victim = { id: 'p2', name: 'Dave' };

    matchService.getLastMatchCreatedId.mockResolvedValue(1);
    matchService.findMatchById.mockResolvedValue(match);
    playerService.findOrCreatePlayer
      .mockResolvedValueOnce(killer)
      .mockResolvedValueOnce(victim);

    const createdKill = {
      timestamp: now,
      match,
      killer,
      victim,
      weapon: undefined,
    };
    killRepository.create.mockReturnValue(createdKill);
    killRepository.save.mockResolvedValue(createdKill);

    await service.handleKill(event);

    expect(killRepository.create).toHaveBeenCalledWith({
      timestamp: now,
      match,
      killer,
      victim,
      weapon: undefined,
    });
    expect(killRepository.save).toHaveBeenCalledWith(createdKill);
  });

  it('deve capturar MatchFullError, logar warn e NÃO salvar/atualizar estatísticas', async () => {
    const now = new Date();
    const event = {
      type: 2,
      timestamp: now,
      killer: 'Eve',
      victim: 'Mallory',
      weapon: 'RAILGUN',
    } as any;

    const match = { id: 42 };
    const killer = { id: 'p-eve', name: 'Eve' };
    const victim = { id: 'p-mal', name: 'Mallory' };

    matchService.getLastMatchCreatedId.mockResolvedValue(42);
    matchService.findMatchById.mockResolvedValue(match);
    playerService.findOrCreatePlayer
      .mockResolvedValueOnce(killer)
      .mockResolvedValueOnce(victim);

    matchParticipationService.associatePlayerToMatch.mockRejectedValue(
      new MatchFullError(match.id),
    );

    await service.handleKill(event);

    expect((service as any).logger.warn).toHaveBeenCalledWith(
      'Match 42 is full',
    );

    expect(killRepository.create).not.toHaveBeenCalled();
    expect(killRepository.save).not.toHaveBeenCalled();

    expect(matchParticipationService.incrementKills).not.toHaveBeenCalled();
    expect(matchParticipationService.incrementDeaths).not.toHaveBeenCalled();
  });
});
