import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/models/device.dart';
import '../../../core/providers.dart';
import '../data/delegations_repository.dart';

final delegationsRepositoryProvider = Provider<DelegationsRepository>((ref) {
  return DelegationsRepository(ref.watch(apiClientProvider));
});

final myDevicesProvider = FutureProvider.autoDispose<List<DeviceModel>>((ref) {
  return ref.watch(delegationsRepositoryProvider).myDevices();
});

final grantedDelegationsProvider =
    FutureProvider.autoDispose<List<Delegation>>((ref) {
  return ref.watch(delegationsRepositoryProvider).granted();
});

final receivedDelegationsProvider =
    FutureProvider.autoDispose<List<Delegation>>((ref) {
  return ref.watch(delegationsRepositoryProvider).received();
});
