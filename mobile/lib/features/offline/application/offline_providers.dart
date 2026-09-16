import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers.dart';
import '../data/sync_service.dart';

final syncServiceProvider = Provider<SyncService>((ref) {
  return SyncService(ref.watch(apiClientProvider), ref.watch(localDbProvider));
});

final autoSyncProvider = Provider<void>((ref) {
  bool wasOffline = false;
  ref.listen(connectivityProvider, (previous, next) {
    final online = next.value ?? true;
    if (online && wasOffline) {
      ref.read(syncServiceProvider).sync();
    }
    wasOffline = !online;
  });
});
