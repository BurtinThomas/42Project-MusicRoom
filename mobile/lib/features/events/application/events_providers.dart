import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';

import '../../../core/models/event.dart';
import '../../../core/providers.dart';
import '../data/events_repository.dart';

final eventsRepositoryProvider = Provider<EventsRepository>((ref) {
  return EventsRepository(ref.watch(apiClientProvider));
});

final eventsListProvider =
    FutureProvider.autoDispose<List<MusicEvent>>((ref) async {
  final db = ref.watch(localDbProvider);
  try {
    final events = await ref.watch(eventsRepositoryProvider).list();
    await db.putCache(
        'events:list', jsonEncode(events.map((e) => e.id).toList()));
    return events;
  } catch (e) {
    final cached = await db.getCache('sync:snapshot');
    if (cached == null) rethrow;
    final snapshot = jsonDecode(cached) as Map<String, dynamic>;
    return (snapshot['events'] as List)
        .map((e) => MusicEvent.fromJson(e['event']))
        .toList();
  }
});

final eventDetailProvider = StateNotifierProvider.autoDispose
    .family<EventDetailController, AsyncValue<EventDetail>, String>(
        (ref, eventId) {
  return EventDetailController(ref, eventId);
});

class EventDetailController extends StateNotifier<AsyncValue<EventDetail>> {
  EventDetailController(this._ref, this.eventId)
      : super(const AsyncValue.loading()) {
    _load();
    _subscribeRealtime();
  }

  final Ref _ref;
  final String eventId;

  EventsRepository get _repo => _ref.read(eventsRepositoryProvider);

  Future<void> _load() async {
    try {
      final detail = await _repo.detail(eventId);
      state = AsyncValue.data(detail);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> _subscribeRealtime() async {
    final channel = _ref.read(eventsSocketProvider);
    final socket = await channel.connect();
    socket.emitWithAck('event:join', eventId, ack: (_) {});

    socket.on('track:added', (_) => _load());
    socket.on('vote:changed', (data) =>
        _patchTrackObject(EventTrack.fromJson(Map<String, dynamic>.from(data))));
    socket.on('track:played', (_) => _load());
  }

  Future<void> vote(String eventTrackId) async {
    final online = _ref.read(connectivityProvider).value ?? true;
    if (!online) {
      await _ref.read(localDbProvider).enqueueAction(
            id: const Uuid().v4(),
            type: 'event.vote',
            payloadJson:
                jsonEncode({'eventId': eventId, 'eventTrackId': eventTrackId}),
          );
      return;
    }
    final updated = await _repo.vote(eventId, eventTrackId);
    _patchTrackObject(updated);
  }

  Future<void> unvote(String eventTrackId) async {
    await _repo.unvote(eventId, eventTrackId);
    await _load();
  }

  Future<void> suggestTrack(
      {required String title, required String artist}) async {
    await _repo.suggestTrack(eventId, title: title, artist: artist);
    await _load();
  }

  Future<void> advance() async {
    await _repo.advance(eventId);
    await _load();
  }

  void _patchTrackObject(EventTrack updated) {
    final current = state.value;
    if (current == null) return;
    final queue = current.queue
        .map((t) => t.id == updated.id ? updated : t)
        .toList()
      ..sort((a, b) => b.score.compareTo(a.score));
    state = AsyncValue.data(EventDetail(
        event: current.event, queue: queue, history: current.history));
  }
}
