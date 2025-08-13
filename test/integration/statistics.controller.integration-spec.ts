process.env.NODE_ENV = 'test';
process.env.DATABASE_HOST = 'localhost';
process.env.DATABASE_PORT = '5432';
process.env.DATABASE_USER = 'postgres';
process.env.DATABASE_PASSWORD = 'postgres';
process.env.DATABASE_NAME = 'nomad-events';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('StatisticsController (Integration)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const gameLogEntries = [
      '01/01/2023 12:00:00 - New match 20000001 has started',
      '01/01/2023 12:01:15 - Ethan killed Hugo using M16',
      '01/01/2023 12:02:10 - Hugo killed Felix using AK47',
      '01/01/2023 12:03:20 - Gavin killed Ethan using Shotgun',
      '01/01/2023 12:04:05 - Felix killed Gavin using M16',
      '01/01/2023 12:05:14 - Ethan killed Gavin using AK47',
      '01/01/2023 12:06:16 - <WORLD> killed Hugo by EXPLOSION',
      '01/01/2023 12:07:02 - Hugo killed Felix using AK47',
      '01/01/2023 14:15:00 - Match 20000001 has ended',
      '01/01/2023 14:25:00 - New match 20000002 has started',
      '01/01/2023 14:26:12 - Brian killed Derek using M16',
      '01/01/2023 14:27:25 - Derek killed Ivan using AK47',
      '01/01/2023 14:28:40 - Ivan killed Brian using Shotgun',
      '01/01/2023 14:29:50 - Derek killed Brian using AK47',
      '01/01/2023 14:31:05 - Brian killed Ivan using M16',
      '01/01/2023 15:54:28 - Brian killed Ivan using Shotgun',
      '01/01/2023 16:11:49 - Derek killed Brian using AK47',
      '01/01/2023 16:15:00 - Match 20000002 has ended',
    ];

    await request(app.getHttpServer())
      .post('/uploads')
      .attach('file', Buffer.from(JSON.stringify(gameLogEntries)), {
        filename: 'test_game_logs.json',
        contentType: 'application/json',
      });

    await new Promise((resolve) => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('GET /statistics/match-ranking/:matchId', () => {
    it('deve retornar ranking do match especificado', async () => {
      const response = await request(app.getHttpServer())
        .get('/statistics/match-ranking/20000001')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThan(0);

      // Verificar estrutura dos dados
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('playerName');
        expect(response.body[0]).toHaveProperty('totalKills');
        expect(response.body[0]).toHaveProperty('totalDeaths');
      }
    });

    it('deve retornar array vazio para match inexistente', async () => {
      const response = await request(app.getHttpServer())
        .get('/statistics/match-ranking/99999999')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(0);
    });

    it('deve retornar erro 400 para matchId inválido', async () => {
      await request(app.getHttpServer())
        .get('/statistics/match-ranking/invalid')
        .expect(400);
    });
  });

  describe('GET /statistics/preferred-weapon/:matchId', () => {
    it('deve retornar arma preferida do vencedor do match', async () => {
      const response = await request(app.getHttpServer())
        .get('/statistics/preferred-weapon/20000001')
        .expect(200);

      if (response.body && Object.keys(response.body).length > 0) {
        expect(response.body).toHaveProperty('winnerName');
        expect(response.body).toHaveProperty('preferredWeapon');
        expect(response.body).toHaveProperty('weaponUsageCount');
        expect(typeof response.body.winnerName).toBe('string');
        expect(typeof response.body.preferredWeapon).toBe('string');
        expect(typeof response.body.weaponUsageCount).toBe('number');
      }
    });

    it('deve retornar objeto vazio para match inexistente', async () => {
      const response = await request(app.getHttpServer())
        .get('/statistics/preferred-weapon/99999999')
        .expect(200);

      expect(response.body).toEqual({});
    });

    it('deve retornar erro 400 para matchId inválido', async () => {
      await request(app.getHttpServer())
        .get('/statistics/preferred-weapon/invalid')
        .expect(400);
    });
  });

  describe('GET /statistics/longest-streak/:matchId', () => {
    it('deve retornar maior sequência de kills do match', async () => {
      const response = await request(app.getHttpServer())
        .get('/statistics/longest-streak/20000001')
        .expect(200);

      if (response.body && Object.keys(response.body).length > 0) {
        expect(response.body).toHaveProperty('playerName');
        expect(response.body).toHaveProperty('longestStreak');
        expect(typeof response.body.playerName).toBe('string');
        expect(typeof response.body.longestStreak).toBe('number');
        expect(response.body.longestStreak).toBeGreaterThanOrEqual(0);
      }
    });

    it('deve retornar objeto vazio para match inexistente', async () => {
      const response = await request(app.getHttpServer())
        .get('/statistics/longest-streak/99999999')
        .expect(200);

      expect(response.body).toEqual({});
    });

    it('deve retornar erro 400 para matchId inválido', async () => {
      await request(app.getHttpServer())
        .get('/statistics/longest-streak/invalid')
        .expect(400);
    });
  });
  describe('GET /statistics/global-ranking', () => {
    it('deve retornar ranking global com paginação padrão', async () => {
      const response = await request(app.getHttpServer())
        .get('/statistics/global-ranking')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);

      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('playerName');
        expect(response.body[0]).toHaveProperty('totalKills');
        expect(response.body[0]).toHaveProperty('totalDeaths');
      }
    });

    it('deve retornar ranking global com parâmetros de paginação customizados', async () => {
      const response = await request(app.getHttpServer())
        .get('/statistics/global-ranking?pageNumber=0&size=5')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeLessThanOrEqual(5);
    });

    it('deve retornar array vazio para página inexistente', async () => {
      const response = await request(app.getHttpServer())
        .get('/statistics/global-ranking?pageNumber=999&size=10')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });

    it('deve lidar com parâmetros de paginação inválidos graciosamente', async () => {
      const response = await request(app.getHttpServer())
        .get('/statistics/global-ranking?pageNumber=invalid&size=invalid')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });

    it('deve aceitar apenas pageNumber como parâmetro', async () => {
      const response = await request(app.getHttpServer())
        .get('/statistics/global-ranking?pageNumber=0')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });

    it('deve aceitar apenas size como parâmetro', async () => {
      const response = await request(app.getHttpServer())
        .get('/statistics/global-ranking?size=10')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeLessThanOrEqual(10);
    });
  });
});
