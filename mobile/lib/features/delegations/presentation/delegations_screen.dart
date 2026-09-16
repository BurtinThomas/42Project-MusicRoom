import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../friends/application/friends_providers.dart';
import '../application/delegations_providers.dart';

class DelegationsScreen extends ConsumerWidget {
  const DelegationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final grantedAsync = ref.watch(grantedDelegationsProvider);
    final receivedAsync = ref.watch(receivedDelegationsProvider);

    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Music Control Delegation'),
          bottom: const TabBar(
              tabs: [Tab(text: 'Granted by me'), Tab(text: 'Given to me')]),
        ),
        floatingActionButton: FloatingActionButton(
          onPressed: () => _showGrantDialog(context, ref),
          child: const Icon(Icons.add),
        ),
        body: TabBarView(
          children: [
            grantedAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => Center(child: Text('$e')),
              data: (list) => list.isEmpty
                  ? const Center(
                      child:
                          Text('You have not delegated control of any device.'))
                  : ListView(
                      children: list
                          .map((d) => ListTile(
                                leading: const Icon(Icons.devices),
                                title: Text(d.deviceModel ?? d.deviceId),
                                subtitle: Text(
                                    'Controlled by ${d.counterpartName ?? d.delegateId}'),
                                trailing: IconButton(
                                  icon: const Icon(Icons.remove_circle_outline),
                                  onPressed: () async {
                                    await ref
                                        .read(delegationsRepositoryProvider)
                                        .revoke(d.id);
                                    ref.invalidate(grantedDelegationsProvider);
                                  },
                                ),
                              ))
                          .toList(),
                    ),
            ),
            receivedAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => Center(child: Text('$e')),
              data: (list) => list.isEmpty
                  ? const Center(
                      child: Text('No one has delegated control to you yet.'))
                  : ListView(
                      children: list
                          .map((d) => ListTile(
                                leading: const Icon(Icons.devices_other),
                                title: Text(d.deviceModel ?? d.deviceId),
                                subtitle: Text(
                                    'Owned by ${d.counterpartName ?? d.ownerId}'),
                              ))
                          .toList(),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _showGrantDialog(BuildContext context, WidgetRef ref) async {
    final devices = await ref.read(myDevicesProvider.future);
    final friends = await ref.read(acceptedFriendsProvider.future);
    if (!context.mounted) return;

    if (devices.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Register a device first (see Settings).')));
      return;
    }
    if (friends.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Add a friend first to delegate control to them.')));
      return;
    }

    String? deviceId = devices.first.id;
    String? delegateId = friends.first.id;

    await showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: const Text('Delegate control'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              DropdownButtonFormField<String>(
                value: deviceId,
                decoration: const InputDecoration(labelText: 'Device'),
                items: devices
                    .map((d) =>
                        DropdownMenuItem(value: d.id, child: Text(d.model)))
                    .toList(),
                onChanged: (v) => setState(() => deviceId = v),
              ),
              DropdownButtonFormField<String>(
                value: delegateId,
                decoration: const InputDecoration(labelText: 'Friend'),
                items: friends
                    .map((f) => DropdownMenuItem(
                        value: f.id, child: Text(f.displayName)))
                    .toList(),
                onChanged: (v) => setState(() => delegateId = v),
              ),
            ],
          ),
          actions: [
            TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Cancel')),
            FilledButton(
              onPressed: () async {
                await ref
                    .read(delegationsRepositoryProvider)
                    .grant(deviceId: deviceId!, delegateId: delegateId!);
                ref.invalidate(grantedDelegationsProvider);
                if (context.mounted) Navigator.pop(context);
              },
              child: const Text('Grant'),
            ),
          ],
        ),
      ),
    );
  }
}
