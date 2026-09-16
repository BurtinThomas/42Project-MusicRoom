import { Module } from '@nestjs/common';
import { DelegationsModule } from '../delegations/delegations.module';
import { EventsController } from './events.controller';
import { EventsGateway } from './events.gateway';
import { EventsService } from './events.service';

@Module({
  imports: [DelegationsModule],
  controllers: [EventsController],
  providers: [EventsService, EventsGateway],
  exports: [EventsService],
})
export class EventsModule {}
