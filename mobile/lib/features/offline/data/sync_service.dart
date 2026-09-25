import 'dart:convert';

import '../../../core/network/api_client.dart';
import '../../../core/storage/local_db.dart';

class SyncOutcome {
  SyncOutcome({required this.appliedCount, required this.rejected});
  final int appliedCount;
  final List<String> rejected;
}

class SyncService {
  SyncService(this._api, this._db);
  final ApiClient _api;
  final LocalDb _db;

  static const _snapshotKey = 'sync:snapshot';

  Future<SyncOutcome> pushOutbox() async {
    final pending = await _db.pendingActions();
    if (pending.isEmpty) return SyncOutcome(appliedCount: 0, rejected: []);

    final response = await _api.raw.post('/sync/replay', data: {
      'actions': pending
          .map((a) => {
                'id': a.id,
                'type': a.type,
                'payload': jsonDecode(a.payloadJson),
              })
          .toList(),
    });

    var applied = 0;
    final rejected = <String>[];

    for (final result in (response.data as List)) {
      final id = result['id'] as String;
      final status = result['status'] as String;
      if (status == 'applied') {
        applied++;
        await _db.markActionStatus(id, 'applied');
      } else {
        final error = result['error'];
        final reason = error is Map ? error['message'] : error;
        rejected.add('$reason');
        await _db.markActionStatus(id, status, error: jsonEncode(error));
      }
    }

    await _db.clearAppliedActions();
    return SyncOutcome(appliedCount: applied, rejected: rejected);
  }

  Future<void> pullSnapshot() async {
    final response = await _api.raw.get('/sync/snapshot');
    await _db.putCache(_snapshotKey, jsonEncode(response.data));
  }

  Future<SyncOutcome> sync() async {
    final outcome = await pushOutbox();
    await pullSnapshot();
    return outcome;
  }

  static Future<Map<String, dynamic>?> cachedSnapshot(LocalDb db) async {
    final raw = await db.getCache(_snapshotKey);
    return raw == null ? null : jsonDecode(raw) as Map<String, dynamic>;
  }
}
