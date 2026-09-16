import { Module } from '@nestjs/common';
import { DelegationsController } from './delegations.controller';
import { DelegationsService } from './delegations.service';

@Module({
  providers: [DelegationsService],
  controllers: [DelegationsController],
  exports: [DelegationsService],
})
export class DelegationsModule {}
