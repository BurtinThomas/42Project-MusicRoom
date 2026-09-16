import { Module } from '@nestjs/common';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';

@Module({
  providers: [DevicesService],
  controllers: [DevicesController],
  exports: [DevicesService],
})
export class DevicesModule {}
