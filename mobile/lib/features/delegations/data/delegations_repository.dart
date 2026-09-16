import '../../../core/models/device.dart';
import '../../../core/network/api_client.dart';

class DelegationsRepository {
  DelegationsRepository(this._api);
  final ApiClient _api;

  Future<List<Delegation>> granted() async {
    final response = await _api.raw.get('/delegations/granted');
    return (response.data as List).map((e) => Delegation.fromJson(e)).toList();
  }

  Future<List<Delegation>> received() async {
    final response = await _api.raw.get('/delegations/received');
    return (response.data as List).map((e) => Delegation.fromJson(e)).toList();
  }

  Future<Delegation> grant(
      {required String deviceId, required String delegateId}) async {
    final response = await _api.raw.post('/delegations',
        data: {'deviceId': deviceId, 'delegateId': delegateId});
    return Delegation.fromJson(response.data);
  }

  Future<void> revoke(String delegationId) {
    return _api.raw.delete('/delegations/$delegationId');
  }

  Future<List<DeviceModel>> myDevices() async {
    final response = await _api.raw.get('/devices');
    return (response.data as List).map((e) => DeviceModel.fromJson(e)).toList();
  }
}
