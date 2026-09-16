import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { SubscriptionsController } from './subscriptions.controller';

@Module({
  imports: [UsersModule],
  controllers: [SubscriptionsController],
})
export class SubscriptionsModule {}
