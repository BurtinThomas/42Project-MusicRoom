import 'package:dio/dio.dart';
import '../../../core/models/playlist.dart';
import '../../../core/network/api_client.dart';

class PlaylistDetail {
  PlaylistDetail({required this.playlist, required this.tracks});
  final Playlist playlist;
  final List<PlaylistTrack> tracks;

  factory PlaylistDetail.fromJson(Map<String, dynamic> json) => PlaylistDetail(
        playlist: Playlist.fromJson(json['playlist']),
        tracks: (json['tracks'] as List)
            .map((e) => PlaylistTrack.fromJson(e))
            .toList(),
      );
}

class PlaylistConflictException implements Exception {
  PlaylistConflictException(this.currentTrack);
  final PlaylistTrack currentTrack;
}

class PlaylistsRepository {
  PlaylistsRepository(this._api);
  final ApiClient _api;

  Future<List<Playlist>> list() async {
    final response = await _api.raw.get('/playlists');
    return (response.data as List).map((e) => Playlist.fromJson(e)).toList();
  }

  Future<PlaylistDetail> detail(String playlistId) async {
    final response = await _api.raw.get('/playlists/$playlistId');
    return PlaylistDetail.fromJson(response.data);
  }

  Future<Playlist> create({
    required String name,
    VisibilityLevel visibility = VisibilityLevel.public,
    EditLicense editLicense = EditLicense.open,
  }) async {
    final response = await _api.raw.post('/playlists', data: {
      'name': name,
      'visibility': visibilityToJson(visibility),
      'editLicense': editLicenseToJson(editLicense),
    });
    return Playlist.fromJson(response.data);
  }

  Future<void> invite(String playlistId, String userId) {
    return _api.raw
        .post('/playlists/$playlistId/invites', data: {'userId': userId});
  }

  Future<PlaylistTrack> addTrack(
    String playlistId, {
    required String title,
    required String artist,
    int? position,
  }) async {
    final response =
        await _api.raw.post('/playlists/$playlistId/tracks', data: {
      'title': title,
      'artist': artist,
      if (position != null) 'position': position,
    });
    return PlaylistTrack.fromJson(response.data);
  }

  Future<void> removeTrack(String playlistId, String playlistTrackId) {
    return _api.raw.delete('/playlists/$playlistId/tracks/$playlistTrackId');
  }

  Future<List<PlaylistTrack>> moveTrack(
    String playlistId,
    String playlistTrackId, {
    required int position,
    required int expectedVersion,
  }) async {
    try {
      final response = await _api.raw.put(
        '/playlists/$playlistId/tracks/$playlistTrackId/position',
        data: {'position': position, 'expectedVersion': expectedVersion},
      );
      return (response.data as List)
          .map((e) => PlaylistTrack.fromJson(e))
          .toList();
    } on DioException catch (e) {
      if (e.response?.statusCode == 409) {
        final current = PlaylistTrack.fromJson(e.response!.data['current']);
        throw PlaylistConflictException(current);
      }
      rethrow;
    }
  }
}
