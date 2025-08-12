import { EventProducerService } from '../event-producer.service';
import { EventConsumerService } from '../event-consumer.service';
import { MatchService } from '../../match/match.service';
import { KillService } from '../../kill/kill.service';
import {
  EventType,
  KillEvent,
  MatchEnded,
  MatchStarted,
} from '../event.interface';
import { Worker } from 'bullmq';

jest.mock('bullmq', () => {
  const workerCloseMock = jest.fn().mockResolvedValue(undefined);

  const Worker = jest
    .fn()
    .mockImplementation(
      (
        queueName: string,
        processor: (job: any) => Promise<void>,
        opts: any,
      ) => {
        return {
          queueName,
          opts,
          close: workerCloseMock,
        };
      },
    );

  const Queue = jest.fn().mockImplementation(() => ({
    add: jest.fn().mockResolvedValue(undefined),
  }));

  (Worker as any).__closeMock = workerCloseMock;

  return { Worker, Queue };
});

describe('Event Services', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('EventProducerService', () => {
    it('deve adicionar o evento na fila com nome "event"', async () => {
      const queueInstance = {
        add: jest.fn().mockResolvedValue(undefined),
      } as any;
      const service = new EventProducerService(queueInstance);

      const payload: MatchStarted = {
        type: EventType.MATCH_STARTED,
        matchId: 123,
        timestamp: new Date(),
      };

      await service.addEvent(payload);

      expect(queueInstance.add).toHaveBeenCalledWith('event', payload);
    });
  });

  describe('EventConsumerService', () => {
    let matchService: { createMatch: jest.Mock; endMatch: jest.Mock };
    let killService: { handleKill: jest.Mock };
    let connection: any;
    let service: EventConsumerService;

    beforeEach(() => {
      matchService = {
        createMatch: jest.fn().mockResolvedValue(undefined),
        endMatch: jest.fn().mockResolvedValue(undefined),
      };
      killService = {
        handleKill: jest.fn().mockResolvedValue(undefined),
      };
      connection = { mock: 'redis-connection' };

      service = new EventConsumerService(
        connection as any,
        matchService as unknown as MatchService,
        killService as unknown as KillService,
      );

      (service as any).logger = {
        log: jest.fn(),
        warn: jest.fn(),
      };
    });

    function getWorkerCtorArgs() {
      expect(
        (Worker as unknown as jest.Mock).mock.calls.length,
      ).toBeGreaterThan(0);
      const lastCall = (Worker as unknown as jest.Mock).mock.calls[
        (Worker as unknown as jest.Mock).mock.calls.length - 1
      ];
      const [queueName, processor, opts] = lastCall;
      return { queueName, processor, opts };
    }

    function getWorkerInstance() {
      const instances = (Worker as unknown as jest.Mock).mock.instances;
      expect(instances.length).toBeGreaterThan(0);
      return instances[instances.length - 1] as any;
    }

    it('onModuleInit deve criar Worker com fila "events" e connection injetada', () => {
      service.onModuleInit();

      expect(Worker).toHaveBeenCalledTimes(1);
      const { queueName, processor, opts } = getWorkerCtorArgs();

      expect(queueName).toBe('events');
      expect(typeof processor).toBe('function');
      expect(opts).toEqual({ connection });
    });

    it('deve processar MATCH_STARTED chamando MatchService.createMatch', async () => {
      service.onModuleInit();
      const { processor } = getWorkerCtorArgs();

      const event: MatchStarted = {
        type: EventType.MATCH_STARTED,
        matchId: 11,
        timestamp: new Date(),
      };

      await processor({ data: event });

      expect((service as any).logger.log).toHaveBeenCalled();
      expect(matchService.createMatch).toHaveBeenCalledWith(event);
      expect(killService.handleKill).not.toHaveBeenCalled();
      expect(matchService.endMatch).not.toHaveBeenCalled();
    });

    it('deve processar KILL chamando KillService.handleKill', async () => {
      service.onModuleInit();
      const { processor } = getWorkerCtorArgs();

      const event: KillEvent = {
        type: EventType.KILL,
        timestamp: new Date(),
        killer: 'A',
        victim: 'B',
        weapon: 'RAILGUN',
      };

      await processor({ data: event });

      expect(killService.handleKill).toHaveBeenCalledWith(event);
      expect(matchService.createMatch).not.toHaveBeenCalled();
      expect(matchService.endMatch).not.toHaveBeenCalled();
    });

    it('deve processar MATCH_ENDED chamando MatchService.endMatch', async () => {
      service.onModuleInit();
      const { processor } = getWorkerCtorArgs();

      const event: MatchEnded = {
        type: EventType.MATCH_ENDED,
        matchId: 77,
        timestamp: new Date(),
      };

      await processor({ data: event });

      expect(matchService.endMatch).toHaveBeenCalledWith(event);
      expect(killService.handleKill).not.toHaveBeenCalled();
      expect(matchService.createMatch).not.toHaveBeenCalled();
    });

    it('deve logar warn para tipo de evento desconhecido', async () => {
      service.onModuleInit();
      const { processor } = getWorkerCtorArgs();

      const unknownEvent = { type: 999, foo: 'bar' } as any;

      await processor({ data: unknownEvent });

      expect((service as any).logger.warn).toHaveBeenCalledWith(
        'Unknown event type: 999',
      );
      expect(matchService.createMatch).not.toHaveBeenCalled();
      expect(killService.handleKill).not.toHaveBeenCalled();
      expect(matchService.endMatch).not.toHaveBeenCalled();
    });
  });
});
