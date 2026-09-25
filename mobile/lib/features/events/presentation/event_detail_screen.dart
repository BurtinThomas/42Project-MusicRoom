import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/models/event.dart';
import '../../../shared/api_error.dart';
import '../../auth/application/auth_controller.dart';
import '../../friends/application/friends_providers.dart';
import '../application/events_providers.dart';

class EventDetailScreen extends ConsumerWidget {
  const EventDetailScreen({super.key, required this.eventId});
  final String eventId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detailAsync = ref.watch(eventDetailProvider(eventId));
    final controller = ref.read(eventDetailProvider(eventId).notifier);
    final myId = ref.watch(currentUserIdProvider).value;
    final isOwner = detailAsync.value?.event.ownerId == myId && myId != null;

    return Scaffold(
      appBar: AppBar(
        title: detailAsync.maybeWhen(
            data: (d) => Text(d.event.name), orElse: () => const Text('Event')),
        actions: [
          if (isOwner) ...[
            IconButton(
              icon: const Icon(Icons.person_add_alt),
              tooltip: 'Invite a friend',
              onPressed: () => _showInviteDialog(context, ref),
            ),
            if (!kIsWeb)
              IconButton(
                icon: const Icon(Icons.sensors),
                tooltip: 'Attach an iBeacon',
                onPressed: () => _showBeaconDialog(context, ref),
              ),
            IconButton(
              icon: const Icon(Icons.skip_next),
              tooltip: 'Play next track',
              onPressed: () => runGuarded(controller.advance),
            ),
          ],
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        icon: const Icon(Icons.add),
        label: const Text('Suggest track'),
        onPressed: () => _showSuggestDialog(context, controller),
      ),
      body: detailAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) =>
            Center(child: Text('Failed to load event: ${apiErrorMessage(e)}')),
        data: (detail) => RefreshIndicator(
          onRefresh: controller.reload,
          child: ListView(
            padding: const EdgeInsets.fromLTRB(12, 12, 12, 88),
            children: [
              Card(
                child: ListTile(
                  leading: Icon(
                      detail.event.visibility == VisibilityLevel.public
                          ? Icons.public
                          : Icons.lock),
                  title: Text(detail.event.visibility == VisibilityLevel.public
                      ? 'Public event'
                      : 'Private event (invited users only)'),
                  subtitle: Text(describeLicense(detail.event)),
                ),
              ),
              if (controller.fromCache)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 8),
                  child: Text('Offline: showing the last synced copy.',
                      style: TextStyle(fontStyle: FontStyle.italic)),
                ),
              const SizedBox(height: 12),
              Text('Up next (most voted first)',
                  style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              if (detail.queue.isEmpty)
                const Padding(
                  padding: EdgeInsets.all(16),
                  child: Text('No track yet. Suggest the first one!'),
                ),
              for (final et in detail.queue)
                Card(
                  child: ListTile(
                    leading: CircleAvatar(child: Text('${et.score}')),
                    title: Text(et.track.title),
                    subtitle: Text(et.track.artist),
                    trailing: IconButton(
                      tooltip: et.votedByMe ? 'Remove my vote' : 'Vote',
                      icon: Icon(et.votedByMe
                          ? Icons.thumb_up_alt
                          : Icons.thumb_up_alt_outlined),
                      color: et.votedByMe
                          ? Theme.of(context).colorScheme.primary
                          : null,
                      onPressed: () =>
                          runGuarded(() => controller.toggleVote(et)),
                    ),
                  ),
                ),
              if (detail.history.isNotEmpty) ...[
                const SizedBox(height: 24),
                Text('Already played',
                    style: Theme.of(context).textTheme.titleMedium),
              ],
              for (final et in detail.history)
                ListTile(
                  leading: const Icon(Icons.check_circle, color: Colors.green),
                  title: Text(et.track.title),
                  subtitle: Text(et.track.artist),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _showInviteDialog(BuildContext context, WidgetRef ref) async {
    final friends = await ref.read(acceptedFriendsProvider.future);
    if (!context.mounted) return;
    if (friends.isEmpty) {
      showMessage('Add a friend first (Friends tab).');
      return;
    }
    await showDialog(
      context: context,
      builder: (context) => SimpleDialog(
        title: const Text('Invite a friend'),
        children: friends
            .map((f) => SimpleDialogOption(
                  onPressed: () async {
                    Navigator.pop(context);
                    await runGuarded(
                      () => ref
                          .read(eventsRepositoryProvider)
                          .invite(eventId, f.id),
                      success: '${f.displayName} invited',
                    );
                  },
                  child: Text(f.displayName),
                ))
            .toList(),
      ),
    );
  }

  Future<void> _showBeaconDialog(BuildContext context, WidgetRef ref) async {
    final uuid =
        TextEditingController(text: '2f234454-cf6d-4a0f-adf2-f4911ba9ffa6');
    final major = TextEditingController(text: '1');
    final minor = TextEditingController(text: '1');
    await showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Attach an iBeacon'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('People scanning near this beacon will receive the '
                'event details (public events only).'),
            TextField(
                controller: uuid,
                decoration: const InputDecoration(labelText: 'Proximity UUID')),
            TextField(
                controller: major,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Major')),
            TextField(
                controller: minor,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Minor')),
          ],
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel')),
          FilledButton(
            onPressed: () async {
              Navigator.pop(context);
              await runGuarded(
                () => ref.read(eventsRepositoryProvider).setBeacon(eventId,
                    uuid: uuid.text.trim(),
                    major: int.tryParse(major.text) ?? 0,
                    minor: int.tryParse(minor.text) ?? 0),
                success: 'Beacon attached',
              );
            },
            child: const Text('Save'),
          ),
        ],
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
                autofocus: true,
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
              final title = titleCtrl.text.trim();
              final artist = artistCtrl.text.trim();
              if (title.isEmpty || artist.isEmpty) {
                showMessage('Title and artist are required.', error: true);
                return;
              }
              Navigator.pop(context);
              runGuarded(
                  () => controller.suggestTrack(title: title, artist: artist));
            },
            child: const Text('Add'),
          ),
        ],
      ),
    );
  }
}
