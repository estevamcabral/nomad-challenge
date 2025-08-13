import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlayerService } from '../player.service';
import { Player } from '../player.entity';

describe('PlayerService', () => {
  let service: PlayerService;
  let repo: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };

  beforeEach(async () => {
    repo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlayerService,
        {
          provide: getRepositoryToken(Player),
          useValue: repo as unknown as Repository<Player>,
        },
      ],
    }).compile();

    service = module.get(PlayerService);
    jest.clearAllMocks();
  });

  it('retorna player existente quando encontrado', async () => {
    const existing: Player = { id: 'p-1' as any, name: 'Alice' } as Player;

    repo.findOne.mockResolvedValue(existing);

    const result = await service.findOrCreatePlayer('Alice');

    expect(repo.findOne).toHaveBeenCalledWith({ where: { name: 'Alice' } });
    expect(repo.create).not.toHaveBeenCalled();
    expect(repo.save).not.toHaveBeenCalled();
    expect(result).toBe(existing);
  });

  it('cria e salva player quando não encontrado', async () => {
    repo.findOne.mockResolvedValue(null);

    const created: Player = { id: undefined as any, name: 'Bob' } as Player;
    const saved: Player = { id: 'p-2' as any, name: 'Bob' } as Player;

    repo.create.mockReturnValue(created);
    repo.save.mockResolvedValue(saved);

    const result = await service.findOrCreatePlayer('Bob');

    expect(repo.findOne).toHaveBeenCalledWith({ where: { name: 'Bob' } });
    expect(repo.create).toHaveBeenCalledWith({ name: 'Bob' });
    expect(repo.save).toHaveBeenCalledWith(created);
    expect(result).toBe(saved);
  });

  it('propaga erro caso save falhe ao criar novo player', async () => {
    repo.findOne.mockResolvedValue(null);
    const created: Player = { id: undefined as any, name: 'Carol' } as Player;

    repo.create.mockReturnValue(created);
    const error = new Error('db error');
    repo.save.mockRejectedValue(error);

    await expect(service.findOrCreatePlayer('Carol')).rejects.toThrow(
      'db error',
    );

    expect(repo.create).toHaveBeenCalledWith({ name: 'Carol' });
    expect(repo.save).toHaveBeenCalledWith(created);
  });
});
