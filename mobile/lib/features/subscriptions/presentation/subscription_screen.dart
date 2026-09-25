import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../shared/api_error.dart';
import '../application/subscriptions_providers.dart';

class SubscriptionScreen extends ConsumerWidget {
  const SubscriptionScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final planAsync = ref.watch(myPlanProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Subscription')),
      body: planAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text(apiErrorMessage(e))),
        data: (plan) => ListView(
          padding: const EdgeInsets.all(16),
          children: [
            if (plan.isFree)
              Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: Text('Playlists: ${plan.playlistsOwned} / '
                    '${plan.freePlaylistLimit} used'),
              ),
            _PlanCard(
              title: 'Free',
              price: '€0',
              features: [
                'Music Track Vote: unlimited events and votes',
                'Music Playlist Editor: up to ${plan.freePlaylistLimit} playlists',
              ],
              selected: plan.isFree,
              onSelect: () => _change(ref, 'FREE'),
            ),
            const SizedBox(height: 16),
            _PlanCard(
              title: 'Paid',
              price: '€4.99 / mo',
              features: const [
                'Music Track Vote: unlimited events and votes',
                'Music Playlist Editor: unlimited playlists',
              ],
              selected: !plan.isFree,
              onSelect: () => _change(ref, 'PAID'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _change(WidgetRef ref, String plan) async {
    await runGuarded(
      () => ref.read(subscriptionsRepositoryProvider).setPlan(plan),
      success: plan == 'PAID'
          ? 'You are now on the Paid plan'
          : 'You are now on the Free plan',
    );
    ref.invalidate(myPlanProvider);
  }
}

class _PlanCard extends StatelessWidget {
  const _PlanCard({
    required this.title,
    required this.price,
    required this.features,
    required this.selected,
    required this.onSelect,
  });

  final String title;
  final String price;
  final List<String> features;
  final bool selected;
  final VoidCallback onSelect;

  @override
  Widget build(BuildContext context) {
    return Card(
      shape: RoundedRectangleBorder(
        side: BorderSide(
            color: selected
                ? Theme.of(context).colorScheme.primary
                : Colors.transparent,
            width: 2),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(children: [
              Text(title, style: Theme.of(context).textTheme.titleLarge),
              const Spacer(),
              Text(price, style: Theme.of(context).textTheme.titleMedium),
            ]),
            const SizedBox(height: 12),
            for (final f in features) Text('• $f'),
            const SizedBox(height: 12),
            OutlinedButton(
              onPressed: selected ? null : onSelect,
              child: Text(selected ? 'Current plan' : 'Switch to $title'),
            ),
          ],
        ),
      ),
    );
  }
}
