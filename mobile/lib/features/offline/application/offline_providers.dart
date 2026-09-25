import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';

import '../../../core/providers.dart';
import '../../../shared/api_error.dart';
import '../../auth/application/auth_controller.dart';
import '../data/sync_service.dart';

final syncServiceProvider = Provider<SyncService>((ref) {
  return SyncService(ref.watch(apiClientProvider), ref.watch(localDbProvider));
});

final outboxCountProvider = StateProvider<int>((ref) => 0);

final syncTickProvider = StateProvider<int>((ref) => 0);

final offlineActionsProvider = Provider<OfflineActions>(OfflineActions.new);

class OfflineActions {
  OfflineActions(this._ref);
  final Ref _ref;

  bool get isOnline => _ref.read(connectivityProvider).value ?? true;

  Future<bool> runOrQueue({
    required String type,
    required Map<String, dynamic> payload,
    required Future<void> Function() online,
  }) async {
    if (isOnline) {
      try {
        await online();
        return false;
      } catch (e) {
        if (!isConnectionError(e)) rethrow;
      }
    }
    await _ref.read(localDbProvider).enqueueAction(
          id: const Uuid().v4(),
          type: type,
          payloadJson: jsonEncode(payload),
        );
    await refreshCount();
    showMessage('Offline: action saved, it will be sent when back online.');
    return true;
  }

  Future<void> refreshCount() async {
    final pending = await _ref.read(localDbProvider).pendingActions();
    _ref.read(outboxCountProvider.notifier).state = pending.length;
  }
}

final autoSyncProvider = Provider<void>((ref) {
  var syncing = false;

  Future<void> run() async {
    if (syncing) return;
    if (ref.read(authControllerProvider).status != AuthStatus.authenticated) {
      return;
    }
    syncing = true;
    try {
      final outcome = await ref.read(syncServiceProvider).sync();
      await ref.read(offlineActionsProvider).refreshCount();
      ref.read(syncTickProvider.notifier).state++;
      if (outcome.appliedCount + outcome.rejected.length > 0) {
        final rejected = outcome.rejected.isEmpty
            ? ''
            : ', ${outcome.rejected.length} rejected: '
                '${outcome.rejected.join(' / ')}';
        showMessage(
          'Synced ${outcome.appliedCount} offline action(s)$rejected',
          error: outcome.rejected.isNotEmpty,
        );
      }
    } catch (_) {
    } finally {
      syncing = false;
    }
  }

  ref.listen(authControllerProvider, (previous, next) {
    if (next.status == AuthStatus.authenticated &&
        previous?.status != AuthStatus.authenticated) {
      run();
    }
  }, fireImmediately: true);

  var wasOffline = false;
  ref.listen(connectivityProvider, (previous, next) {
    final online = next.value ?? true;
    if (online && wasOffline) run();
    wasOffline = !online;
  });
});
