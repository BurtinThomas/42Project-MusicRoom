import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { ChangePlanDto } from './dto/change-plan.dto';
import { PlanDto } from './dto/plan.dto';
import { SubscriptionsService } from './subscriptions.service';

@ApiTags('subscriptions (Free vs. Paid bonus)')
@ApiBearerAuth()
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptions: SubscriptionsService) {}

  @Get('me')
  @ApiOkResponse({ type: PlanDto })
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.subscriptions.get(user.id);
  }

  @Post('me')
  @ApiCreatedResponse({ type: PlanDto })
  change(@CurrentUser() user: AuthenticatedUser, @Body() dto: ChangePlanDto) {
    return this.subscriptions.change(user.id, dto.plan);
  }
}
