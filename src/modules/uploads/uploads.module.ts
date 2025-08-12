import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { EventsModule } from '../events/events.module';
import { UploadsService } from './uploads.service';

@Module({
  imports: [EventsModule],
  controllers: [UploadsController],
  providers: [UploadsService],
})
export class UploadsModule {}
