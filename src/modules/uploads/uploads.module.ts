import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { EventModule } from '../event/event.module';
import { UploadsService } from './uploads.service';

@Module({
  imports: [EventModule],
  controllers: [UploadsController],
  providers: [UploadsService],
})
export class UploadsModule {}
