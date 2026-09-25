import 'event.dart';
export 'event.dart' show VisibilityLevel, visibilityFromJson, visibilityToJson;
import 'track.dart';

enum EditLicense { open, inviteOnly }

EditLicense editLicenseFromJson(String v) =>
    v == 'INVITE_ONLY' ? EditLicense.inviteOnly : EditLicense.open;
String editLicenseToJson(EditLicense v) =>
    v == EditLicense.inviteOnly ? 'INVITE_ONLY' : 'OPEN';

class Playlist {
  Playlist({
    required this.id,
    required this.ownerId,
    required this.name,
    required this.visibility,
    required this.editLicense,
  });

  final String id;
  final String ownerId;
  final String name;
  final VisibilityLevel visibility;
  final EditLicense editLicense;

  factory Playlist.fromJson(Map<String, dynamic> json) => Playlist(
        id: json['id'] as String,
        ownerId: json['ownerId'] as String,
        name: json['name'] as String,
        visibility: visibilityFromJson(json['visibility'] as String),
        editLicense: editLicenseFromJson(json['editLicense'] as String),
      );
}

class PlaylistTrack {
  PlaylistTrack({
    required this.id,
    required this.playlistId,
    required this.track,
    required this.position,
    required this.version,
  });

  final String id;
  final String playlistId;
  final Track track;
  final int position;
  final int version;

  factory PlaylistTrack.fromJson(Map<String, dynamic> json) => PlaylistTrack(
        id: json['id'] as String,
        playlistId: json['playlistId'] as String,
        track: Track.fromJson(Map<String, dynamic>.from(json['track'] as Map)),
        position: json['position'] as int,
        version: json['version'] as int,
      );
}
