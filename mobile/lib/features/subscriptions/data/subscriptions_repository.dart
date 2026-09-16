import '../../../core/network/api_client.dart';

class SubscriptionsRepository {
  SubscriptionsRepository(this._api);
  final ApiClient _api;

  Future<String> myPlan() async {
    final response = await _api.raw.get('/subscriptions/me');
    return response.data['plan'] as String;
  }

  Future<String> setPlan(String plan) async {
    final response =
        await _api.raw.post('/subscriptions/me', data: {'plan': plan});
    return response.data['plan'] as String;
  }
}
