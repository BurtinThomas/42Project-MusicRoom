import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/providers.dart';
import '../../features/offline/application/offline_providers.dart';

class HomeShell extends StatelessWidget {
  const HomeShell({super.key, required this.navigationShell});
  final StatefulNavigationShell navigationShell;

  static const _destinations = [
    (
      icon: Icons.how_to_vote_outlined,
      selected: Icons.how_to_vote,
      label: 'Vote'
    ),
    (
      icon: Icons.queue_music_outlined,
      selected: Icons.queue_music,
      label: 'Playlists'
    ),
    (icon: Icons.people_outline, selected: Icons.people, label: 'Friends'),
    (
      icon: Icons.settings_outlined,
      selected: Icons.settings,
      label: 'Settings'
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final isWide = MediaQuery.sizeOf(context).width >= 800;
    final body = Column(children: [
      const _OfflineBanner(),
      Expanded(child: navigationShell),
    ]);

    if (isWide) {
      return Scaffold(
        body: Row(
          children: [
            NavigationRail(
              selectedIndex: navigationShell.currentIndex,
              onDestinationSelected: (i) => navigationShell.goBranch(i),
              labelType: NavigationRailLabelType.all,
              destinations: [
                for (final d in _destinations)
                  NavigationRailDestination(
                      icon: Icon(d.icon),
                      selectedIcon: Icon(d.selected),
                      label: Text(d.label)),
              ],
            ),
            const VerticalDivider(width: 1),
            Expanded(child: body),
          ],
        ),
      );
    }

    return Scaffold(
      body: body,
      bottomNavigationBar: NavigationBar(
        selectedIndex: navigationShell.currentIndex,
        onDestinationSelected: (i) => navigationShell.goBranch(i),
        destinations: [
          for (final d in _destinations)
            NavigationDestination(
                icon: Icon(d.icon),
                selectedIcon: Icon(d.selected),
                label: d.label),
        ],
      ),
    );
  }
}

class _OfflineBanner extends ConsumerWidget {
  const _OfflineBanner();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final online = ref.watch(connectivityProvider).value ?? true;
    final pending = ref.watch(outboxCountProvider);
    if (online && pending == 0) return const SizedBox.shrink();

    final text = online
        ? '$pending offline action(s) waiting for the server'
        : 'Offline — showing the last synced data'
            '${pending > 0 ? ', $pending action(s) waiting' : ''}';
    return Material(
      color: Theme.of(context).colorScheme.tertiaryContainer,
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
          child: Row(children: [
            const Icon(Icons.cloud_off, size: 18),
            const SizedBox(width: 8),
            Expanded(child: Text(text)),
          ]),
        ),
      ),
    );
  }
}
