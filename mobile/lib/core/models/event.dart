import 'track.dart';

enum VisibilityLevel { public, private }

enum VoteLicense { open, inviteOnly, locationTime }

VisibilityLevel visibilityFromJson(String v) =>
    v == 'PRIVATE' ? VisibilityLevel.private : VisibilityLevel.public;
String visibilityToJson(VisibilityLevel v) =>
    v == VisibilityLevel.private ? 'PRIVATE' : 'PUBLIC';

VoteLicense voteLicenseFromJson(String v) {
  switch (v) {
    case 'INVITE_ONLY':
      return VoteLicense.inviteOnly;
    case 'LOCATION_TIME':
      return VoteLicense.locationTime;
    default:
      return VoteLicense.open;
  }
}

String voteLicenseToJson(VoteLicense v) {
  switch (v) {
    case VoteLicense.inviteOnly:
      return 'INVITE_ONLY';
    case VoteLicense.locationTime:
      return 'LOCATION_TIME';
    case VoteLicense.open:
      return 'OPEN';
  }
}

class MusicEvent {
  MusicEvent({
    required this.id,
    required this.ownerId,
    required this.name,
    required this.visibility,
    required this.voteLicense,
    this.locationLat,
    this.locationLng,
    this.locationRadiusM,
    this.voteWindowStart,
    this.voteWindowEnd,
  });

  final String id;
  final String ownerId;
  final String name;
  final VisibilityLevel visibility;
  final VoteLicense voteLicense;
  final double? locationLat;
  final double? locationLng;
  final int? locationRadiusM;
  final DateTime? voteWindowStart;
  final DateTime? voteWindowEnd;

  factory MusicEvent.fromJson(Map<String, dynamic> json) => MusicEvent(
        id: json['id'] as String,
        ownerId: json['ownerId'] as String,
        name: json['name'] as String,
        visibility: visibilityFromJson(json['visibility'] as String),
        voteLicense: voteLicenseFromJson(json['voteLicense'] as String),
        locationLat: (json['locationLat'] as num?)?.toDouble(),
        locationLng: (json['locationLng'] as num?)?.toDouble(),
        locationRadiusM: json['locationRadiusM'] as int?,
        voteWindowStart: json['voteWindowStart'] != null
            ? DateTime.parse(json['voteWindowStart'])
            : null,
        voteWindowEnd: json['voteWindowEnd'] != null
            ? DateTime.parse(json['voteWindowEnd'])
            : null,
      );
}

class EventTrack {
  EventTrack({
    required this.id,
    required this.eventId,
    required this.track,
    required this.score,
    this.playedAt,
    this.votedByMe = false,
  });

  final String id;
  final String eventId;
  final Track track;
  final int score;
  final DateTime? playedAt;
  final bool votedByMe;

  EventTrack copyWith({int? score, bool? votedByMe}) => EventTrack(
        id: id,
        eventId: eventId,
        track: track,
        score: score ?? this.score,
        playedAt: playedAt,
        votedByMe: votedByMe ?? this.votedByMe,
      );

  factory EventTrack.fromJson(Map<String, dynamic> json) => EventTrack(
        id: json['id'] as String,
        eventId: json['eventId'] as String,
        track: Track.fromJson(Map<String, dynamic>.from(json['track'] as Map)),
        score: json['score'] as int,
        playedAt:
            json['playedAt'] != null ? DateTime.parse(json['playedAt']) : null,
        votedByMe: json['votedByMe'] as bool? ?? false,
      );
}
