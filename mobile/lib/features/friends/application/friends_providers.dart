import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/models/friendship.dart';
import '../../../core/providers.dart';
import '../../profile/application/profile_providers.dart';
import '../data/friends_repository.dart';

final friendsRepositoryProvider = Provider<FriendsRepository>((ref) {
  return FriendsRepository(ref.watch(apiClientProvider));
});

final friendshipsProvider = FutureProvider.autoDispose<List<Friendship>>((ref) {
  return ref.watch(friendsRepositoryProvider).list();
});

final acceptedFriendsProvider =
    FutureProvider.autoDispose<List<FriendRef>>((ref) async {
  final me = await ref.watch(myProfileProvider.future);
  final friendships = await ref.watch(friendshipsProvider.future);
  return friendships
      .where((f) => f.status == 'ACCEPTED')
      .map((f) => f.other(me.id))
      .toList();
});
