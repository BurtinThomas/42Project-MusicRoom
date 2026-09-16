import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { PlaylistsModule } from '../playlists/playlists.module';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';

@Module({
  imports: [EventsModule, PlaylistsModule],
  controllers: [SyncController],
  providers: [SyncService],
})
export class SyncModule {}
