import { Module } from '@nestjs/common';
import { PlaylistsController } from './playlists.controller';
import { PlaylistsGateway } from './playlists.gateway';
import { PlaylistsService } from './playlists.service';

@Module({
  controllers: [PlaylistsController],
  providers: [PlaylistsService, PlaylistsGateway],
  exports: [PlaylistsService],
})
export class PlaylistsModule {}
