import '../../../core/models/friendship.dart';
import '../../../core/network/api_client.dart';

class FriendsRepository {
  FriendsRepository(this._api);
  final ApiClient _api;

  Future<List<Friendship>> list() async {
    final response = await _api.raw.get('/friendships');
    return (response.data as List).map((e) => Friendship.fromJson(e)).toList();
  }

  Future<void> request(String addresseeId) {
    return _api.raw.post('/friendships', data: {'addresseeId': addresseeId});
  }

  Future<void> respond(String friendshipId, bool accept) {
    return _api.raw
        .post('/friendships/$friendshipId/respond', data: {'accept': accept});
  }
}
