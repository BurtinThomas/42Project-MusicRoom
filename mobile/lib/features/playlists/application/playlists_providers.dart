import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/models/playlist.dart';
import '../../../core/providers.dart';
import '../data/playlists_repository.dart';

final playlistsRepositoryProvider = Provider<PlaylistsRepository>((ref) {
  return PlaylistsRepository(ref.watch(apiClientProvider));
});

final playlistsListProvider = FutureProvider.autoDispose<List<Playlist>>((ref) {
  return ref.watch(playlistsRepositoryProvider).list();
});

final playlistDetailProvider = StateNotifierProvider.autoDispose
    .family<PlaylistDetailController, AsyncValue<PlaylistDetail>, String>(
        (ref, playlistId) {
  return PlaylistDetailController(ref, playlistId);
});

class PlaylistDetailController
    extends StateNotifier<AsyncValue<PlaylistDetail>> {
  PlaylistDetailController(this._ref, this.playlistId)
      : super(const AsyncValue.loading()) {
    _load();
    _subscribeRealtime();
  }

  final Ref _ref;
  final String playlistId;

  PlaylistsRepository get _repo => _ref.read(playlistsRepositoryProvider);

  Future<void> _load() async {
    try {
      final detail = await _repo.detail(playlistId);
      state = AsyncValue.data(detail);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> _subscribeRealtime() async {
    final channel = _ref.read(playlistsSocketProvider);
    final socket = await channel.connect();
    socket.emitWithAck('playlist:join', playlistId, ack: (_) {});
    socket.on('track:added', (_) => _load());
    socket.on('track:removed', (_) => _load());
    socket.on('reordered', (_) => _load());
  }

  Future<void> addTrack({required String title, required String artist}) async {
    await _repo.addTrack(playlistId, title: title, artist: artist);
    await _load();
  }

  Future<void> removeTrack(String playlistTrackId) async {
    await _repo.removeTrack(playlistId, playlistTrackId);
    await _load();
  }

  Future<String?> moveTrack(
      String playlistTrackId, int newPosition, int expectedVersion) async {
    try {
      final tracks = await _repo.moveTrack(
        playlistId,
        playlistTrackId,
        position: newPosition,
        expectedVersion: expectedVersion,
      );
      final current = state.value;
      if (current != null) {
        state = AsyncValue.data(
            PlaylistDetail(playlist: current.playlist, tracks: tracks));
      }
      return null;
    } on PlaylistConflictException {
      await _load();
      return 'This track was changed by someone else — the list was refreshed.';
    }
  }
}
