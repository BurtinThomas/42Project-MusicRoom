import '../../../core/models/event.dart';
import '../../../core/network/api_client.dart';

class EventDetail {
  EventDetail(
      {required this.event, required this.queue, required this.history});
  final MusicEvent event;
  final List<EventTrack> queue;
  final List<EventTrack> history;

  factory EventDetail.fromJson(Map<String, dynamic> json) => EventDetail(
        event: MusicEvent.fromJson(json['event']),
        queue:
            (json['queue'] as List).map((e) => EventTrack.fromJson(e)).toList(),
        history: (json['history'] as List)
            .map((e) => EventTrack.fromJson(e))
            .toList(),
      );
}

class EventsRepository {
  EventsRepository(this._api);
  final ApiClient _api;

  Future<List<MusicEvent>> list() async {
    final response = await _api.raw.get('/events');
    return (response.data as List).map((e) => MusicEvent.fromJson(e)).toList();
  }

  Future<EventDetail> detail(String eventId) async {
    final response = await _api.raw.get('/events/$eventId');
    return EventDetail.fromJson(response.data);
  }

  Future<MusicEvent> create({
    required String name,
    VisibilityLevel visibility = VisibilityLevel.public,
    VoteLicense voteLicense = VoteLicense.open,
    double? locationLat,
    double? locationLng,
    int? locationRadiusM,
    DateTime? voteWindowStart,
    DateTime? voteWindowEnd,
  }) async {
    final response = await _api.raw.post('/events', data: {
      'name': name,
      'visibility': visibilityToJson(visibility),
      'voteLicense': voteLicenseToJson(voteLicense),
      if (locationLat != null) 'locationLat': locationLat,
      if (locationLng != null) 'locationLng': locationLng,
      if (locationRadiusM != null) 'locationRadiusM': locationRadiusM,
      if (voteWindowStart != null)
        'voteWindowStart': voteWindowStart.toIso8601String(),
      if (voteWindowEnd != null)
        'voteWindowEnd': voteWindowEnd.toIso8601String(),
    });
    return MusicEvent.fromJson(response.data);
  }

  Future<void> invite(String eventId, String userId) {
    return _api.raw.post('/events/$eventId/invites', data: {'userId': userId});
  }

  Future<EventTrack> suggestTrack(
    String eventId, {
    required String title,
    required String artist,
    int? durationMs,
    String? externalRef,
  }) async {
    final response = await _api.raw.post('/events/$eventId/tracks', data: {
      'title': title,
      'artist': artist,
      if (durationMs != null) 'durationMs': durationMs,
      if (externalRef != null) 'externalRef': externalRef,
    });
    return EventTrack.fromJson(response.data);
  }

  Future<EventTrack> vote(String eventId, String eventTrackId,
      {double? lat, double? lng}) async {
    final response = await _api.raw
        .post('/events/$eventId/tracks/$eventTrackId/vote', data: {
      if (lat != null) 'lat': lat,
      if (lng != null) 'lng': lng,
    });
    return EventTrack.fromJson(response.data);
  }

  Future<void> unvote(String eventId, String eventTrackId) {
    return _api.raw.delete('/events/$eventId/tracks/$eventTrackId/vote');
  }

  Future<EventTrack> advance(String eventId) async {
    final response = await _api.raw.post('/events/$eventId/advance');
    return EventTrack.fromJson(response.data);
  }
}
