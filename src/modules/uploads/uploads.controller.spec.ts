import { Test, TestingModule } from '@nestjs/testing';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';

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

  it('should call processLogLine for each file and return result', async () => {
    const files = ['file1', 'file2'];
    (service.processLogLine as jest.Mock).mockResolvedValue(undefined);

    const result = await controller.upload(files);

    expect(service.processLogLine).toHaveBeenCalledTimes(files.length);
    files.forEach((file, i) => {
      expect(service.processLogLine).toHaveBeenNthCalledWith(i + 1, file);
    });
    expect(result).toEqual({
      message: 'Upload completed',
      count: files.length,
    });
  });
});
