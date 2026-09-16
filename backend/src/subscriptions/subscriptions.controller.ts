import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { SubscriptionPlan } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { UsersService } from '../users/users.service';

class ChangePlanDto {
  @IsEnum(SubscriptionPlan)
  plan!: SubscriptionPlan;
}

@ApiTags('subscriptions')
@ApiBearerAuth()
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async me(@CurrentUser() user: AuthenticatedUser) {
    const full = await this.usersService.findById(user.id);
    return { plan: full?.subscriptionPlan };
  }

  @Post('me')
  async change(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePlanDto,
  ) {
    const updated = await this.usersService.setSubscriptionPlan(
      user.id,
      dto.plan,
    );
    return { plan: updated.subscriptionPlan };
  }
}
