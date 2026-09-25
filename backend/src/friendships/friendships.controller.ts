import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { FriendshipDto, FriendshipWithUsersDto } from './dto/friendship.dto';
import { RequestFriendshipDto } from './dto/request-friendship.dto';
import { RespondFriendshipDto } from './dto/respond-friendship.dto';
import { FriendshipsService } from './friendships.service';

@ApiTags('friendships')
@ApiBearerAuth()
@Controller('friendships')
export class FriendshipsController {
  constructor(private readonly friendships: FriendshipsService) {}

  @Get()
  @ApiOkResponse({
    type: [FriendshipWithUsersDto],
    description: 'Pending and accepted friendships of the caller',
  })
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.friendships.listFor(user.id);
  }

  @Post()
  @ApiCreatedResponse({ type: FriendshipDto })
  request(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RequestFriendshipDto,
  ) {
    return this.friendships.request(user.id, dto.addresseeId);
  }

  @Post(':id/respond')
  @ApiCreatedResponse({
    type: FriendshipDto,
    description: 'The accepted friendship, or the deleted request if declined',
  })
  respond(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: RespondFriendshipDto,
  ) {
    return this.friendships.respond(user.id, id, dto.accept);
  }
}
