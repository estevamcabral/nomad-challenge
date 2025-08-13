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

describe('UploadsController (Integration)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('POST /uploads', () => {
    it('deve fazer upload de arquivo JSON válido e processar as entradas', async () => {
      const gameLogEntries = [
        '01/01/2023 12:00:00 - New match 20000001 has started',
        '01/01/2023 12:01:15 - Ethan killed Hugo using M16',
        '01/01/2023 12:02:10 - Hugo killed Felix using AK47',
        '01/01/2023 14:15:00 - Match 20000001 has ended',
      ];

      const response = await request(app.getHttpServer())
        .post('/uploads')
        .attach('file', Buffer.from(JSON.stringify(gameLogEntries)), {
          filename: 'game_logs.json',
          contentType: 'application/json',
        })
        .expect(201);

      expect(response.body).toEqual({
        message: 'Upload completed',
        count: gameLogEntries.length,
      });
    });

    it('deve processar arquivo JSON com diferentes tipos de eventos', async () => {
      const gameLogEntries = [
        '01/01/2023 12:00:00 - New match 20000002 has started',
        '01/01/2023 12:01:15 - Brian killed Derek using M16',
        '01/01/2023 12:02:10 - <WORLD> killed Ivan by EXPLOSION',
        '01/01/2023 12:03:20 - Derek killed Brian using AK47',
        '01/01/2023 14:15:00 - Match 20000002 has ended',
      ];

      const response = await request(app.getHttpServer())
        .post('/uploads')
        .attach('file', Buffer.from(JSON.stringify(gameLogEntries)), {
          filename: 'game_logs_test.json',
          contentType: 'application/json',
        })
        .expect(201);

      expect(response.body).toEqual({
        message: 'Upload completed',
        count: gameLogEntries.length,
      });
    });

    it('deve processar arquivo JSON vazio', async () => {
      const gameLogEntries: string[] = [];

      const response = await request(app.getHttpServer())
        .post('/uploads')
        .attach('file', Buffer.from(JSON.stringify(gameLogEntries)), {
          filename: 'empty_logs.json',
          contentType: 'application/json',
        })
        .expect(201);

      expect(response.body).toEqual({
        message: 'Upload completed',
        count: 0,
      });
    });

    it('deve retornar erro 400 quando nenhum arquivo é enviado', async () => {
      const response = await request(app.getHttpServer())
        .post('/uploads')
        .expect(400);

      expect(response.body.message).toBe('File is required');
    });

    it('deve retornar erro 400 quando arquivo não é JSON válido', async () => {
      const invalidJson = 'invalid json content';

      await request(app.getHttpServer())
        .post('/uploads')
        .attach('file', Buffer.from(invalidJson), {
          filename: 'invalid.json',
          contentType: 'application/json',
        })
        .expect(400);
    });

    it('deve processar arquivo JSON com conteúdo inválido graciosamente', async () => {
      const gameLogEntries = [
        '01/01/2023 12:00:00 - New match 20000003 has started',
        'invalid log format',
        '01/01/2023 12:01:15 - Brian killed Derek using M16',
        '01/01/2023 14:15:00 - Match 20000003 has ended',
      ];

      const response = await request(app.getHttpServer())
        .post('/uploads')
        .attach('file', Buffer.from(JSON.stringify(gameLogEntries)), {
          filename: 'mixed_logs.json',
          contentType: 'application/json',
        })
        .expect(201);

      expect(response.body).toEqual({
        message: 'Upload completed',
        count: gameLogEntries.length,
      });
    });
  });
});
