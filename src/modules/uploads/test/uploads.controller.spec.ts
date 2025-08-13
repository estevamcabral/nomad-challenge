import { Test, TestingModule } from '@nestjs/testing';
import { UploadsController } from '../uploads.controller';
import { UploadsService } from '../uploads.service';
import { BadRequestException } from '@nestjs/common';

describe('UploadsController', () => {
  let controller: UploadsController;
  let service: UploadsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadsController],
      providers: [
        {
          provide: UploadsService,
          useValue: { processLogLine: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<UploadsController>(UploadsController);
    service = module.get<UploadsService>(UploadsService);
  });

  it('deve processar o conteúdo JSON do arquivo e retornar o resultado', async () => {
    const entries = ['line1', 'line2'];
    const file = {
      buffer: Buffer.from(JSON.stringify(entries), 'utf-8'),
    } as any;

    (service.processLogLine as jest.Mock).mockResolvedValue(undefined);

    const result = await controller.upload(file);

    expect(service.processLogLine).toHaveBeenCalledTimes(entries.length);
    entries.forEach((entry, i) => {
      expect(service.processLogLine).toHaveBeenNthCalledWith(i + 1, entry);
    });
    expect(result).toEqual({
      message: 'Upload completed',
      count: entries.length,
    });
  });

  it('deve lançar BadRequestException quando nenhum arquivo for enviado', async () => {
    await expect(controller.upload(undefined as any)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
