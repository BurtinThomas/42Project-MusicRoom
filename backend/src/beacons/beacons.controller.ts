import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { BeaconsService } from './beacons.service';
import {
  EventBeaconDto,
  NearbyEventDto,
  ScanBeaconDto,
  SetEventBeaconDto,
} from './dto/beacon.dto';

@ApiTags('beacons (IoT bonus)')
@Controller('beacons')
export class BeaconsController {
  constructor(private readonly beaconsService: BeaconsService) {}

  @ApiBearerAuth()
  @Post('events/:eventId')
  @ApiCreatedResponse({
    type: EventBeaconDto,
    description: 'Owner only: attaches (or replaces) the event iBeacon',
  })
  setForEvent(
    @CurrentUser() user: AuthenticatedUser,
    @Param('eventId') eventId: string,
    @Body() dto: SetEventBeaconDto,
  ) {
    return this.beaconsService.setForEvent(user.id, eventId, dto);
  }

  @Public()
  @Post('scan')
  @ApiCreatedResponse({
    type: NearbyEventDto,
    description: 'The public event a detected beacon belongs to',
  })
  scan(@Body() dto: ScanBeaconDto) {
    return this.beaconsService.scan(dto.uuid, dto.major, dto.minor);
  }
}
