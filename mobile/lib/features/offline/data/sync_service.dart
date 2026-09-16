import 'dart:convert';

import '../../../core/network/api_client.dart';
import '../../../core/storage/local_db.dart';

class SyncOutcome {
  SyncOutcome(
      {required this.appliedCount,
      required this.conflicts,
      required this.errors});
  final int appliedCount;
  final List<String> conflicts;
  final List<String> errors;
}

class SyncService {
  SyncService(this._api, this._db);
  final ApiClient _api;
  final LocalDb _db;

  Future<SyncOutcome> pushOutbox() async {
    final pending = await _db.pendingActions();
    if (pending.isEmpty) {
      return SyncOutcome(appliedCount: 0, conflicts: [], errors: []);
    }

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
    final conflicts = <String>[];
    final errors = <String>[];

    for (final result in (response.data as List)) {
      final id = result['id'] as String;
      final status = result['status'] as String;
      if (status == 'applied') {
        applied++;
        await _db.markActionStatus(id, 'applied');
      } else if (status == 'conflict') {
        conflicts.add(id);
        await _db.markActionStatus(id, 'conflict',
            error: jsonEncode(result['error']));
      } else {
        errors.add(id);
        await _db.markActionStatus(id, 'error',
            error: jsonEncode(result['error']));
      }
    }

    await _db.clearAppliedActions();
    return SyncOutcome(
        appliedCount: applied, conflicts: conflicts, errors: errors);
  }

  Future<void> pullSnapshot() async {
    final response = await _api.raw.get('/sync/snapshot');
    await _db.putCache('sync:snapshot', jsonEncode(response.data));
  }

  Future<SyncOutcome> sync() async {
    final outcome = await pushOutbox();
    await pullSnapshot();
    return outcome;
  }
}
