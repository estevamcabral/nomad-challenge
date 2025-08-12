import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Player } from './player.entity';

@Injectable()
export class PlayerService {
  private readonly logger = new Logger(PlayerService.name);

  constructor(
    @InjectRepository(Player)
    private readonly playerRepository: Repository<Player>,
  ) {}

  async findOrCreatePlayer(name: string): Promise<Player> {
    let player = await this.playerRepository.findOne({ where: { name } });

    if (!player) {
      player = this.playerRepository.create({ name });
      player = await this.playerRepository.save(player);
    }

    return player;
  }
}
