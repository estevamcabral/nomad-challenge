import { Test } from '@nestjs/testing';

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_HOST = 'localhost';
  process.env.DATABASE_PORT = '5432';
  process.env.DATABASE_USER = 'postgres';
  process.env.DATABASE_PASSWORD = 'postgres';
  process.env.DATABASE_NAME = 'nomad-events';
  process.env.REDIS_HOST = 'localhost';
  process.env.REDIS_PORT = '6379';
});

afterAll(async () => {});

export async function createTestApp(imports: any[], providers: any[] = []) {
  const moduleFixture = await Test.createTestingModule({
    imports,
    providers,
  }).compile();

  const app = moduleFixture.createNestApplication();
  await app.init();

  return { app, moduleFixture };
}
