import { Body, Controller, Post } from '@nestjs/common';

@Controller('uploads')
export class UploadsController {
  @Post()
  async upload(@Body() files: string[]) {
    files.forEach((file) => console.log(file));

    return {
      message: 'Upload completed',
      count: files.length,
    };
  }
}
