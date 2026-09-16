import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../friends/application/friends_providers.dart';
import '../application/playlists_providers.dart';

class PlaylistDetailScreen extends ConsumerWidget {
  const PlaylistDetailScreen({super.key, required this.playlistId});
  final String playlistId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detailAsync = ref.watch(playlistDetailProvider(playlistId));
    final controller = ref.read(playlistDetailProvider(playlistId).notifier);

    return Scaffold(
      appBar: AppBar(
        title: detailAsync.maybeWhen(
            data: (d) => Text(d.playlist.name),
            orElse: () => const Text('Playlist')),
        actions: [
          IconButton(
            icon: const Icon(Icons.person_add_alt),
            tooltip: 'Invite a friend',
            onPressed: () => _showInviteDialog(context, ref),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        icon: const Icon(Icons.add),
        label: const Text('Add track'),
        onPressed: () => _showAddDialog(context, controller),
      ),
      body: detailAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Failed to load playlist: $e')),
        data: (detail) => ReorderableListView.builder(
          padding: const EdgeInsets.all(12),
          itemCount: detail.tracks.length,
          onReorder: (oldIndex, newIndex) async {
            final track = detail.tracks[oldIndex];
            final target = newIndex > oldIndex ? newIndex - 1 : newIndex;
            final message =
                await controller.moveTrack(track.id, target, track.version);
            if (message != null && context.mounted) {
              ScaffoldMessenger.of(context)
                  .showSnackBar(SnackBar(content: Text(message)));
            }
          },
          itemBuilder: (context, i) {
            final t = detail.tracks[i];
            return Card(
              key: ValueKey(t.id),
              child: ListTile(
                leading: const Icon(Icons.drag_handle),
                title: Text(t.track.title),
                subtitle: Text(t.track.artist),
                trailing: IconButton(
                  icon: const Icon(Icons.delete_outline),
                  onPressed: () => controller.removeTrack(t.id),
                ),
              ),
            );
          },
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
                        .read(playlistsRepositoryProvider)
                        .invite(playlistId, f.id);
                    if (context.mounted) Navigator.pop(context);
                  },
                  child: Text(f.displayName),
                ))
            .toList(),
      ),
    );
  }

  Future<void> _showAddDialog(
      BuildContext context, PlaylistDetailController controller) async {
    final titleCtrl = TextEditingController();
    final artistCtrl = TextEditingController();
    await showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Add a track'),
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
              controller.addTrack(
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
