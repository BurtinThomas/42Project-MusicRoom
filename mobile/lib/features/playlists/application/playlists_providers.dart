import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;

import '../../../core/models/playlist.dart';
import '../../../core/providers.dart';
import '../../../shared/api_error.dart';
import '../../offline/application/offline_providers.dart';
import '../../offline/data/sync_service.dart';
import '../data/playlists_repository.dart';

final playlistsRepositoryProvider = Provider<PlaylistsRepository>((ref) {
  return PlaylistsRepository(ref.watch(apiClientProvider));
});

final playlistsListProvider =
    FutureProvider.autoDispose<List<Playlist>>((ref) async {
  ref.watch(syncTickProvider);
  try {
    return await ref.watch(playlistsRepositoryProvider).list();
  } catch (e) {
    if (!isConnectionError(e)) rethrow;
    final snapshot =
        await SyncService.cachedSnapshot(ref.read(localDbProvider));
    if (snapshot == null) rethrow;
    return (snapshot['playlists'] as List)
        .map((p) => Playlist.fromJson(Map<String, dynamic>.from(p['playlist'])))
        .toList();
  }
});

final playlistDetailProvider = StateNotifierProvider.autoDispose
    .family<PlaylistDetailController, AsyncValue<PlaylistDetail>, String>(
        (ref, playlistId) {
  final controller = PlaylistDetailController(ref, playlistId);
  ref.listen(syncTickProvider, (_, __) => controller.reload());
  return controller;
});

class PlaylistDetailController
    extends StateNotifier<AsyncValue<PlaylistDetail>> {
  PlaylistDetailController(this._ref, this.playlistId)
      : super(const AsyncValue.loading()) {
    reload();
    _subscribeRealtime();
  }

  final Ref _ref;
  final String playlistId;
  io.Socket? _socket;
  final Map<String, void Function(dynamic)> _handlers = {};

  bool fromCache = false;

  PlaylistsRepository get _repo => _ref.read(playlistsRepositoryProvider);
  OfflineActions get _offline => _ref.read(offlineActionsProvider);

  Future<void> reload() async {
    try {
      final detail = await _repo.detail(playlistId);
      fromCache = false;
      if (mounted) state = AsyncValue.data(detail);
    } catch (e, st) {
      final cached = isConnectionError(e) ? await _fromSnapshot() : null;
      if (!mounted) return;
      fromCache = cached != null;
      state =
          cached != null ? AsyncValue.data(cached) : AsyncValue.error(e, st);
    }
  }

  Future<PlaylistDetail?> _fromSnapshot() async {
    final snapshot =
        await SyncService.cachedSnapshot(_ref.read(localDbProvider));
    final playlists = (snapshot?['playlists'] as List?) ?? [];
    for (final p in playlists) {
      if (p['playlist']['id'] == playlistId) {
        return PlaylistDetail.fromJson(Map<String, dynamic>.from(p));
      }
    }
    return null;
  }

  Future<void> _subscribeRealtime() async {
    final socket = await _ref.read(playlistsSocketProvider).connect();
    if (!mounted) return;
    _socket = socket;
    socket.emitWithAck('playlist:join', playlistId, ack: (_) {});

    void onChange(dynamic data) {
      if (data is Map && data['playlistId'] == playlistId) reload();
    }

    for (final event in ['track:added', 'track:removed', 'reordered']) {
      _handlers[event] = onChange;
    }
    _handlers.forEach(socket.on);
  }

  @override
  void dispose() {
    final socket = _socket;
    if (socket != null) {
      _handlers.forEach(socket.off);
      socket.emit('playlist:leave', playlistId);
    }
    super.dispose();
  }

  Future<void> addTrack({required String title, required String artist}) async {
    await _offline.runOrQueue(
      type: 'playlist.addTrack',
      payload: {'playlistId': playlistId, 'title': title, 'artist': artist},
      online: () => _repo.addTrack(playlistId, title: title, artist: artist),
    );
    await reload();
  }

  Future<void> removeTrack(String playlistTrackId) async {
    final queued = await _offline.runOrQueue(
      type: 'playlist.removeTrack',
      payload: {'playlistId': playlistId, 'playlistTrackId': playlistTrackId},
      online: () => _repo.removeTrack(playlistId, playlistTrackId),
    );
    if (queued) {
      _setTracks(
          [...?state.value?.tracks.where((t) => t.id != playlistTrackId)]);
    } else {
      await reload();
    }
  }

  Future<String?> moveTrack(
      String playlistTrackId, int newPosition, int expectedVersion) async {
    final current = state.value;
    if (current == null) return null;
    final tracks = [...current.tracks];
    final moved = tracks.firstWhere((t) => t.id == playlistTrackId);
    tracks
      ..remove(moved)
      ..insert(newPosition.clamp(0, tracks.length), moved);
    _setTracks(tracks);

    try {
      await _offline.runOrQueue(
        type: 'playlist.moveTrack',
        payload: {
          'playlistId': playlistId,
          'playlistTrackId': playlistTrackId,
          'position': newPosition,
          'expectedVersion': expectedVersion,
        },
        online: () async => _setTracks(await _repo.moveTrack(
          playlistId,
          playlistTrackId,
          position: newPosition,
          expectedVersion: expectedVersion,
        )),
      );
      return null;
    } on PlaylistConflictException {
      await reload();
      return 'Someone moved this track at the same time: the list was '
          'refreshed, try again.';
    } catch (e) {
      await reload();
      return apiErrorMessage(e);
    }
  }

  void _setTracks(List<PlaylistTrack> tracks) {
    final current = state.value;
    if (current == null || !mounted) return;
    state = AsyncValue.data(
        PlaylistDetail(playlist: current.playlist, tracks: tracks));
  }
}
