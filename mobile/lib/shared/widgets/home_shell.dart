import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

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
    (
      icon: Icons.devices_outlined,
      selected: Icons.devices,
      label: 'Delegation'
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
            Expanded(child: navigationShell),
          ],
        ),
      );
    }

    return Scaffold(
      body: navigationShell,
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
