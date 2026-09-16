import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { DelegationsService } from './delegations.service';
import { GrantDelegationDto } from './dto/grant-delegation.dto';

@ApiTags('delegations (Music Control Delegation)')
@ApiBearerAuth()
@Controller('delegations')
export class DelegationsController {
  constructor(private readonly delegationsService: DelegationsService) {}

  @Get('granted')
  listGranted(@CurrentUser() user: AuthenticatedUser) {
    return this.delegationsService.listForOwner(user.id);
  }

  @Get('received')
  listReceived(@CurrentUser() user: AuthenticatedUser) {
    return this.delegationsService.listReceivedBy(user.id);
  }

  @Post()
  grant(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: GrantDelegationDto,
  ) {
    return this.delegationsService.grant(user.id, dto);
  }

  @Delete(':id')
  revoke(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.delegationsService.revoke(user.id, id);
  }
}
