import { Injectable, Logger } from '@nestjs/common';
import { EventsProducerService } from '../events/events-producer.service';
import { parseEvent } from '../events/parser/events.parser';

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  constructor(private readonly eventsQueueService: EventsProducerService) {}

  async processLogLine(line: string): Promise<void> {
    const event = parseEvent(line);

    if (!event) {
      this.logger.warn(`Wrong format: ${line}`);
      return;
    }

    await this.eventsQueueService.addEvent(event);
  }
}
