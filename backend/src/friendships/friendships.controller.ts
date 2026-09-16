import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsUUID } from 'class-validator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { FriendshipsService } from './friendships.service';

class RequestFriendshipDto {
  @IsUUID()
  addresseeId!: string;
}

class RespondFriendshipDto {
  @IsBoolean()
  accept!: boolean;
}

@ApiTags('friendships')
@ApiBearerAuth()
@Controller('friendships')
export class FriendshipsController {
  constructor(private readonly friendships: FriendshipsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.friendships.listFor(user.id);
  }

  @Post()
  request(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RequestFriendshipDto,
  ) {
    return this.friendships.request(user.id, dto.addresseeId);
  }

  @Post(':id/respond')
  respond(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: RespondFriendshipDto,
  ) {
    return this.friendships.respond(user.id, id, dto.accept);
  }
}
