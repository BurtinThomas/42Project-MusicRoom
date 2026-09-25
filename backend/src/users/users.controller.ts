import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { ProfileDto } from './dto/profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOkResponse({ type: ProfileDto })
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getProfileForViewer(user.id, user.id);
  }

  @Patch('me')
  @ApiOkResponse({ type: ProfileDto })
  async updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ) {
    await this.usersService.updateProfile(user.id, dto);
    return this.usersService.getProfileForViewer(user.id, user.id);
  }

  @Get(':id')
  @ApiOkResponse({
    type: ProfileDto,
    description: 'Filtered for the caller: friendsInfo only for friends',
  })
  get(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.usersService.getProfileForViewer(user.id, id);
  }
}
