import { Module } from '@nestjs/common';
import { FriendshipsModule } from '../friendships/friendships.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [FriendshipsModule],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
