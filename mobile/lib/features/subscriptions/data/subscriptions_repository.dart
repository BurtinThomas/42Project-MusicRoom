import '../../../core/models/plan.dart';
import '../../../core/network/api_client.dart';

class SubscriptionsRepository {
  SubscriptionsRepository(this._api);
  final ApiClient _api;

  Future<Plan> myPlan() async {
    final response = await _api.raw.get('/subscriptions/me');
    return Plan.fromJson(response.data);
  }

  Future<Plan> setPlan(String plan) async {
    final response =
        await _api.raw.post('/subscriptions/me', data: {'plan': plan});
    return Plan.fromJson(response.data);
  }
}
