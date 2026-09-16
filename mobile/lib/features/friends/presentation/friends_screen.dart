import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

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
                  onPressed: () =>
                      Clipboard.setData(ClipboardData(text: me.id)),
                ),
              ),
            ),
            orElse: () => const SizedBox.shrink(),
          ),
          Expanded(
            child: friendshipsAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => Center(child: Text('$e')),
              data: (friendships) {
                final me = meAsync.value;
                if (me == null) return const SizedBox.shrink();
                if (friendships.isEmpty) {
                  return const Center(child: Text('No friends yet.'));
                }
                return ListView(
                  children: friendships.map((f) {
                    final other = f.other(me.id);
                    final isIncoming =
                        f.addressee.id == me.id && f.status == 'PENDING';
                    return ListTile(
                      leading: const Icon(Icons.person),
                      title: Text(other.displayName),
                      subtitle: Text(f.status),
                      trailing: isIncoming
                          ? Row(mainAxisSize: MainAxisSize.min, children: [
                              IconButton(
                                icon: const Icon(Icons.check,
                                    color: Colors.green),
                                onPressed: () async {
                                  await ref
                                      .read(friendsRepositoryProvider)
                                      .respond(f.id, true);
                                  ref.invalidate(friendshipsProvider);
                                },
                              ),
                              IconButton(
                                icon:
                                    const Icon(Icons.close, color: Colors.red),
                                onPressed: () async {
                                  await ref
                                      .read(friendsRepositoryProvider)
                                      .respond(f.id, false);
                                  ref.invalidate(friendshipsProvider);
                                },
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

  Future<void> _showAddDialog(BuildContext context, WidgetRef ref) async {
    final idCtrl = TextEditingController();
    await showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Add a friend'),
        content: TextField(
          controller: idCtrl,
          decoration: const InputDecoration(labelText: "Friend's user ID"),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel')),
          FilledButton(
            onPressed: () async {
              await ref
                  .read(friendsRepositoryProvider)
                  .request(idCtrl.text.trim());
              ref.invalidate(friendshipsProvider);
              if (context.mounted) Navigator.pop(context);
            },
            child: const Text('Send request'),
          ),
        ],
      ),
    );
  }
}
