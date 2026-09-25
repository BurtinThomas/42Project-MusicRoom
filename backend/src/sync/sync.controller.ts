import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { ReplayActionsDto } from './dto/replay-actions.dto';
import { ReplayResultDto, SnapshotDto } from './dto/snapshot.dto';
import { SyncService } from './sync.service';

@ApiTags('sync (Offline mode bonus)')
@ApiBearerAuth()
@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get('snapshot')
  @ApiOkResponse({
    type: SnapshotDto,
    description: 'Everything the app needs to work offline',
  })
  snapshot(@CurrentUser() user: AuthenticatedUser) {
    return this.syncService.snapshot(user.id);
  }

  @Post('replay')
  @ApiCreatedResponse({
    type: [ReplayResultDto],
    description: 'One result per action, in the order they were sent',
  })
  replay(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ReplayActionsDto,
  ) {
    return this.syncService.replay(user.id, dto.actions);
  }
}
