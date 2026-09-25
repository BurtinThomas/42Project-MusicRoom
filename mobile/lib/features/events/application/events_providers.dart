import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;

import '../../../core/location/current_position.dart';
import '../../../core/models/event.dart';
import '../../../core/providers.dart';
import '../../../shared/api_error.dart';
import '../../offline/application/offline_providers.dart';
import '../../offline/data/sync_service.dart';
import '../data/events_repository.dart';

final eventsRepositoryProvider = Provider<EventsRepository>((ref) {
  return EventsRepository(ref.watch(apiClientProvider));
});

final eventsListProvider =
    FutureProvider.autoDispose<List<MusicEvent>>((ref) async {
  ref.watch(syncTickProvider);
  try {
    return await ref.watch(eventsRepositoryProvider).list();
  } catch (e) {
    if (!isConnectionError(e)) rethrow;
    final snapshot =
        await SyncService.cachedSnapshot(ref.read(localDbProvider));
    if (snapshot == null) rethrow;
    return (snapshot['events'] as List)
        .map((e) => MusicEvent.fromJson(e['event']))
        .toList();
  }
});

final eventDetailProvider = StateNotifierProvider.autoDispose
    .family<EventDetailController, AsyncValue<EventDetail>, String>(
        (ref, eventId) {
  final controller = EventDetailController(ref, eventId);
  ref.listen(syncTickProvider, (_, __) => controller.reload());
  return controller;
});

class EventDetailController extends StateNotifier<AsyncValue<EventDetail>> {
  EventDetailController(this._ref, this.eventId)
      : super(const AsyncValue.loading()) {
    reload();
    _subscribeRealtime();
  }

  final Ref _ref;
  final String eventId;
  io.Socket? _socket;
  final Map<String, void Function(dynamic)> _handlers = {};

  bool fromCache = false;

  EventsRepository get _repo => _ref.read(eventsRepositoryProvider);
  OfflineActions get _offline => _ref.read(offlineActionsProvider);

  Future<void> reload() async {
    try {
      final detail = await _repo.detail(eventId);
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

  Future<EventDetail?> _fromSnapshot() async {
    final snapshot =
        await SyncService.cachedSnapshot(_ref.read(localDbProvider));
    final events = (snapshot?['events'] as List?) ?? [];
    for (final e in events) {
      if (e['event']['id'] == eventId) {
        return EventDetail.fromJson(Map<String, dynamic>.from(e));
      }
    }
    return null;
  }

  Future<void> _subscribeRealtime() async {
    final socket = await _ref.read(eventsSocketProvider).connect();
    if (!mounted) return;
    _socket = socket;
    socket.emitWithAck('event:join', eventId, ack: (_) {});

    bool mine(dynamic data) => data is Map && data['eventId'] == eventId;
    _handlers['track:added'] = (data) {
      if (mine(data)) reload();
    };
    _handlers['track:played'] = (data) {
      if (mine(data)) reload();
    };
    _handlers['vote:changed'] = (data) {
      if (mine(data)) {
        _patch(EventTrack.fromJson(Map<String, dynamic>.from(data)),
            keepMyVote: true);
      }
    };
    _handlers.forEach(socket.on);
  }

  @override
  void dispose() {
    final socket = _socket;
    if (socket != null) {
      _handlers.forEach(socket.off);
      socket.emit('event:leave', eventId);
    }
    super.dispose();
  }

  Future<Map<String, dynamic>> _voteBody() async {
    final event = state.value?.event;
    if (event?.voteLicense != VoteLicense.locationTime) return {};
    final pos = await currentPosition();
    return {'lat': pos.lat, 'lng': pos.lng};
  }

  Future<void> toggleVote(EventTrack et) =>
      et.votedByMe ? _unvote(et) : _vote(et);

  Future<void> _vote(EventTrack et) async {
    final body = await _voteBody();
    final queued = await _offline.runOrQueue(
      type: 'event.vote',
      payload: {'eventId': eventId, 'eventTrackId': et.id, ...body},
      online: () async => _patch(
          (await _repo.vote(eventId, et.id, lat: body['lat'], lng: body['lng']))
              .copyWith(votedByMe: true)),
    );
    if (queued) _patch(et.copyWith(score: et.score + 1, votedByMe: true));
  }

  Future<void> _unvote(EventTrack et) async {
    final queued = await _offline.runOrQueue(
      type: 'event.unvote',
      payload: {'eventId': eventId, 'eventTrackId': et.id},
      online: () async => _patch(
          (await _repo.unvote(eventId, et.id)).copyWith(votedByMe: false)),
    );
    if (queued) _patch(et.copyWith(score: et.score - 1, votedByMe: false));
  }

  Future<void> suggestTrack(
      {required String title, required String artist}) async {
    await _offline.runOrQueue(
      type: 'event.suggestTrack',
      payload: {'eventId': eventId, 'title': title, 'artist': artist},
      online: () => _repo.suggestTrack(eventId, title: title, artist: artist),
    );
    await reload();
  }

  Future<void> advance() async {
    await _repo.advance(eventId);
    await reload();
  }

  void _patch(EventTrack updated, {bool keepMyVote = false}) {
    final current = state.value;
    if (current == null || !mounted) return;
    final order = {
      for (var i = 0; i < current.queue.length; i++) current.queue[i].id: i
    };
    final queue = current.queue.map((t) {
      if (t.id != updated.id) return t;
      return keepMyVote ? updated.copyWith(votedByMe: t.votedByMe) : updated;
    }).toList()
      ..sort((a, b) {
        final byScore = b.score.compareTo(a.score);
        return byScore != 0 ? byScore : order[a.id]!.compareTo(order[b.id]!);
      });
    state = AsyncValue.data(EventDetail(
        event: current.event, queue: queue, history: current.history));
  }
}

String describeLicense(MusicEvent e) {
  switch (e.voteLicense) {
    case VoteLicense.open:
      return 'Everyone can vote';
    case VoteLicense.inviteOnly:
      return 'Only invited users can vote';
    case VoteLicense.locationTime:
      String hm(DateTime? d) {
        if (d == null) return '?';
        final l = d.toLocal();
        return '${l.day}/${l.month} ${l.hour.toString().padLeft(2, '0')}:'
            '${l.minute.toString().padLeft(2, '0')}';
      }
      return 'Vote within ${e.locationRadiusM ?? '?'} m of the venue, '
          '${hm(e.voteWindowStart)} → ${hm(e.voteWindowEnd)}';
  }
}
