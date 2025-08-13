import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';

@ApiTags('uploads')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  @ApiOperation({
    summary: 'Upload JSON file',
    description:
      'Accepts a single .json file via multipart/form-data from Swagger UI.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Send a .json file containing a JSON array of strings.',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'JSON file',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'File processed successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Upload completed' },
        count: {
          type: 'number',
          example: 2,
          description: 'Number of entries processed',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const content = file.buffer.toString('utf-8');
    let entries: string[];
    
    try {
      entries = JSON.parse(content);
    } catch (error) {
      throw new BadRequestException('Invalid JSON format');
    }

    for (const entry of entries) {
      await this.uploadsService.processLogLine(entry);
    }

    return {
      message: 'Upload completed',
      count: entries.length,
    };
  }
}
