import { Body, Controller, Post } from '@nestjs/common';
import { UploadsService } from './uploads.service';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  async upload(@Body() files: string[]) {
    for (const file of files) {
      await this.uploadsService.processLogLine(file);
    }

    return {
      message: 'Upload completed',
      count: files.length,
    };
  }
}
