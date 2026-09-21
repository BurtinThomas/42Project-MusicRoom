import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers.dart';
import '../data/beacon_service.dart';

final beaconServiceProvider = Provider.autoDispose<BeaconService>((ref) {
  final service = BeaconService(ref.watch(apiClientProvider));
  ref.onDispose(service.dispose);
  return service;
});
