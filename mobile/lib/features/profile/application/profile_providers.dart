import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/models/user_profile.dart';
import '../../../core/providers.dart';
import '../data/profile_repository.dart';

final profileRepositoryProvider = Provider<ProfileRepository>((ref) {
  return ProfileRepository(ref.watch(apiClientProvider));
});

final myProfileProvider = FutureProvider.autoDispose<UserProfile>((ref) {
  return ref.watch(profileRepositoryProvider).me();
});
