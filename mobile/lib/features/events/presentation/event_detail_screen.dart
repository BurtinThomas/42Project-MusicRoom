import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../friends/application/friends_providers.dart';
import '../application/events_providers.dart';

class EventDetailScreen extends ConsumerWidget {
  const EventDetailScreen({super.key, required this.eventId});
  final String eventId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detailAsync = ref.watch(eventDetailProvider(eventId));
    final controller = ref.read(eventDetailProvider(eventId).notifier);

    return Scaffold(
      appBar: AppBar(
        title: detailAsync.maybeWhen(
            data: (d) => Text(d.event.name), orElse: () => const Text('Event')),
        actions: [
          IconButton(
            icon: const Icon(Icons.person_add_alt),
            tooltip: 'Invite a friend',
            onPressed: () => _showInviteDialog(context, ref),
          ),
          IconButton(
            icon: const Icon(Icons.skip_next),
            tooltip: 'Play next track',
            onPressed: controller.advance,
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        icon: const Icon(Icons.add),
        label: const Text('Suggest track'),
        onPressed: () => _showSuggestDialog(context, controller),
      ),
      body: detailAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Failed to load event: $e')),
        data: (detail) => ListView(
          padding: const EdgeInsets.all(12),
          children: [
            Text('Queue', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            for (final et in detail.queue)
              Card(
                child: ListTile(
                  leading: CircleAvatar(child: Text('${et.score}')),
                  title: Text(et.track.title),
                  subtitle: Text(et.track.artist),
                  trailing: IconButton(
                    icon: const Icon(Icons.thumb_up_alt_outlined),
                    onPressed: () => controller.vote(et.id),
                  ),
                ),
              ),
            const SizedBox(height: 24),
            Text('History', style: Theme.of(context).textTheme.titleMedium),
            for (final et in detail.history)
              ListTile(
                leading: const Icon(Icons.check_circle, color: Colors.green),
                title: Text(et.track.title),
                subtitle: Text(et.track.artist),
              ),
          ],
        ),
      ),
    );
  }

  Future<void> _showInviteDialog(BuildContext context, WidgetRef ref) async {
    final friends = await ref.read(acceptedFriendsProvider.future);
    if (!context.mounted) return;
    if (friends.isEmpty) {
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Add a friend first.')));
      return;
    }
    await showDialog(
      context: context,
      builder: (context) => SimpleDialog(
        title: const Text('Invite a friend'),
        children: friends
            .map((f) => SimpleDialogOption(
                  onPressed: () async {
                    await ref
                        .read(eventsRepositoryProvider)
                        .invite(eventId, f.id);
                    if (context.mounted) Navigator.pop(context);
                  },
                  child: Text(f.displayName),
                ))
            .toList(),
      ),
    );
  }

  Future<void> _showSuggestDialog(
      BuildContext context, EventDetailController controller) async {
    final titleCtrl = TextEditingController();
    final artistCtrl = TextEditingController();
    await showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Suggest a track'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
                controller: titleCtrl,
                decoration: const InputDecoration(labelText: 'Title')),
            TextField(
                controller: artistCtrl,
                decoration: const InputDecoration(labelText: 'Artist')),
          ],
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel')),
          FilledButton(
            onPressed: () {
              controller.suggestTrack(
                  title: titleCtrl.text, artist: artistCtrl.text);
              Navigator.pop(context);
            },
            child: const Text('Add'),
          ),
        ],
      ),
    );
  }
}
