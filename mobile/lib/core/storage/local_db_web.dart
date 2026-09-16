import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import 'local_db_types.dart';

class LocalDb {
  static const _cachePrefix = 'cache:';
  static const _outboxKey = 'outbox_actions';

  Future<void> putCache(String key, String jsonValue) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('$_cachePrefix$key', jsonValue);
  }

  Future<String?> getCache(String key) async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('$_cachePrefix$key');
  }

  Future<void> enqueueAction({
    required String id,
    required String type,
    required String payloadJson,
  }) async {
    final actions = await _readOutbox();
    actions.add(OutboxActionData(
      id: id,
      type: type,
      payloadJson: payloadJson,
      createdAt: DateTime.now(),
    ));
    await _writeOutbox(actions);
  }

  Future<List<OutboxActionData>> pendingActions() async {
    final actions = await _readOutbox();
    final pending = actions.where((a) => a.status == 'pending').toList()
      ..sort((a, b) => a.createdAt.compareTo(b.createdAt));
    return pending;
  }

  Future<void> markActionStatus(String id, String status,
      {String? error}) async {
    final actions = await _readOutbox();
    final updated = actions
        .map((a) =>
            a.id == id ? a.copyWith(status: status, lastError: error) : a)
        .toList();
    await _writeOutbox(updated);
  }

  Future<void> clearAppliedActions() async {
    final actions = await _readOutbox();
    await _writeOutbox(actions.where((a) => a.status != 'applied').toList());
  }

  Future<List<OutboxActionData>> _readOutbox() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_outboxKey);
    if (raw == null) return [];
    final list = jsonDecode(raw) as List;
    return list
        .map((e) => OutboxActionData.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> _writeOutbox(List<OutboxActionData> actions) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
        _outboxKey, jsonEncode(actions.map((a) => a.toJson()).toList()));
  }
}
