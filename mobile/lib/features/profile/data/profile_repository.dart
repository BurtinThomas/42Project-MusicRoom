import '../../../core/models/user_profile.dart';
import '../../../core/network/api_client.dart';

class ProfileRepository {
  ProfileRepository(this._api);
  final ApiClient _api;

  Future<UserProfile> me() async {
    final response = await _api.raw.get('/users/me');
    return UserProfile.fromJson(response.data);
  }

  Future<UserProfile> getUser(String id) async {
    final response = await _api.raw.get('/users/$id');
    return UserProfile.fromJson(response.data);
  }

  Future<UserProfile> updateMe({
    String? displayName,
    Map<String, dynamic>? publicInfo,
    Map<String, dynamic>? friendsInfo,
    Map<String, dynamic>? privateInfo,
    Map<String, dynamic>? musicPreferences,
  }) async {
    final response = await _api.raw.patch('/users/me', data: {
      if (displayName != null) 'displayName': displayName,
      if (publicInfo != null) 'publicInfo': publicInfo,
      if (friendsInfo != null) 'friendsInfo': friendsInfo,
      if (privateInfo != null) 'privateInfo': privateInfo,
      if (musicPreferences != null) 'musicPreferences': musicPreferences,
    });
    return UserProfile.fromJson(response.data);
  }
}
