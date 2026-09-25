import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../shared/api_error.dart';
import '../../profile/application/profile_providers.dart';
import '../application/friends_providers.dart';

class FriendsScreen extends ConsumerWidget {
  const FriendsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final friendshipsAsync = ref.watch(friendshipsProvider);
    final meAsync = ref.watch(myProfileProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Friends')),
      floatingActionButton: FloatingActionButton(
        tooltip: 'Add a friend',
        onPressed: () => _showAddDialog(context, ref),
        child: const Icon(Icons.person_add),
      ),
      body: Column(
        children: [
          meAsync.maybeWhen(
            data: (me) => Card(
              margin: const EdgeInsets.all(12),
              child: ListTile(
                title: const Text('Your ID (share it so friends can add you)'),
                subtitle: SelectableText(me.id),
                trailing: IconButton(
                  icon: const Icon(Icons.copy),
                  tooltip: 'Copy',
                  onPressed: () async {
                    await Clipboard.setData(ClipboardData(text: me.id));
                    showMessage('ID copied');
                  },
                ),
              ),
            ),
            orElse: () => const SizedBox.shrink(),
          ),
          Expanded(
            child: friendshipsAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => Center(child: Text(apiErrorMessage(e))),
              data: (friendships) {
                final me = meAsync.value;
                if (me == null) return const SizedBox.shrink();
                if (friendships.isEmpty) {
                  return const Center(child: Text('No friends yet.'));
                }
                return ListView(
                  children: friendships.map((f) {
                    final other = f.other(me.id);
                    final accepted = f.status == 'ACCEPTED';
                    final isIncoming = f.addressee.id == me.id && !accepted;
                    return ListTile(
                      leading: const Icon(Icons.person),
                      title: Text(other.displayName),
                      subtitle: Text(accepted
                          ? 'Friend — tap to see their profile'
                          : isIncoming
                              ? 'Wants to be your friend'
                              : 'Request sent, waiting for an answer'),
                      onTap: accepted
                          ? () => context.push('/friends/${other.id}')
                          : null,
                      trailing: isIncoming
                          ? Row(mainAxisSize: MainAxisSize.min, children: [
                              IconButton(
                                tooltip: 'Accept',
                                icon: const Icon(Icons.check,
                                    color: Colors.green),
                                onPressed: () => _respond(ref, f.id, true),
                              ),
                              IconButton(
                                tooltip: 'Decline',
                                icon:
                                    const Icon(Icons.close, color: Colors.red),
                                onPressed: () => _respond(ref, f.id, false),
                              ),
                            ])
                          : null,
                    );
                  }).toList(),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _respond(WidgetRef ref, String id, bool accept) async {
    await runGuarded(
        () => ref.read(friendsRepositoryProvider).respond(id, accept));
    ref.invalidate(friendshipsProvider);
  }

  Future<void> _showAddDialog(BuildContext context, WidgetRef ref) async {
    final idCtrl = TextEditingController();
    await showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Add a friend'),
        content: TextField(
          controller: idCtrl,
          autofocus: true,
          decoration: const InputDecoration(
              labelText: "Friend's user ID",
              helperText: 'They can copy it from their Friends tab'),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel')),
          FilledButton(
            onPressed: () async {
              final ok = await runGuarded(
                () => ref
                    .read(friendsRepositoryProvider)
                    .request(idCtrl.text.trim()),
                success: 'Friend request sent',
              );
              ref.invalidate(friendshipsProvider);
              if (ok && context.mounted) Navigator.pop(context);
            },
            child: const Text('Send request'),
          ),
        ],
      ),
    );
  }
}
