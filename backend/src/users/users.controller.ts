import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async me(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getProfileForViewer(user.id, user.id);
  }

  @Patch('me')
  async updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ) {
    const updated = await this.usersService.updateProfile(user.id, dto);
    return this.usersService.getProfileForViewer(user.id, updated.id);
  }

  @Get(':id')
  async get(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.usersService.getProfileForViewer(user.id, id);
  }
}
