import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/models/user_profile.dart';
import '../../../shared/api_error.dart';
import '../../profile/application/profile_providers.dart';

final userProfileProvider =
    FutureProvider.autoDispose.family<UserProfile, String>((ref, userId) {
  return ref.watch(profileRepositoryProvider).getUser(userId);
});

class FriendProfileScreen extends ConsumerWidget {
  const FriendProfileScreen({super.key, required this.userId});
  final String userId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(userProfileProvider(userId));

    return Scaffold(
      appBar: AppBar(
          title: profileAsync.maybeWhen(
              data: (p) => Text(p.displayName),
              orElse: () => const Text('Profile'))),
      body: profileAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text(apiErrorMessage(e))),
        data: (p) => ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _InfoCard(title: 'Public information', info: p.publicInfo),
            _InfoCard(
              title: 'Friends-only information',
              info: p.friendsInfo,
              hiddenText: 'Only visible to their friends.',
            ),
            _InfoCard(title: 'Music preferences', info: p.musicPreferences),
          ],
        ),
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  const _InfoCard({required this.title, required this.info, this.hiddenText});
  final String title;
  final Map<String, dynamic>? info;
  final String? hiddenText;

  @override
  Widget build(BuildContext context) {
    final entries = info?.entries.toList() ?? [];
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            if (info == null)
              Text(hiddenText ?? 'Not visible to you.',
                  style: const TextStyle(fontStyle: FontStyle.italic))
            else if (entries.isEmpty)
              const Text('Nothing shared.',
                  style: TextStyle(fontStyle: FontStyle.italic))
            else
              for (final e in entries) Text('${e.key}: ${e.value}'),
          ],
        ),
      ),
    );
  }
}
