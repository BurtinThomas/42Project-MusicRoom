import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/models/playlist.dart';
import '../../../shared/api_error.dart';
import '../../auth/application/auth_controller.dart';
import '../../friends/application/friends_providers.dart';
import '../application/playlists_providers.dart';

class PlaylistDetailScreen extends ConsumerWidget {
  const PlaylistDetailScreen({super.key, required this.playlistId});
  final String playlistId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detailAsync = ref.watch(playlistDetailProvider(playlistId));
    final controller = ref.read(playlistDetailProvider(playlistId).notifier);
    final myId = ref.watch(currentUserIdProvider).value;
    final isOwner = myId != null && detailAsync.value?.playlist.ownerId == myId;

    return Scaffold(
      appBar: AppBar(
        title: detailAsync.maybeWhen(
            data: (d) => Text(d.playlist.name),
            orElse: () => const Text('Playlist')),
        actions: [
          if (isOwner)
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
        error: (e, _) => Center(
            child: Text('Failed to load playlist: ${apiErrorMessage(e)}')),
        data: (detail) => Column(
          children: [
            Card(
              margin: const EdgeInsets.fromLTRB(12, 12, 12, 0),
              child: ListTile(
                leading: Icon(
                    detail.playlist.visibility == VisibilityLevel.public
                        ? Icons.public
                        : Icons.lock),
                title: Text(detail.playlist.visibility == VisibilityLevel.public
                    ? 'Public playlist'
                    : 'Private playlist (invited users only)'),
                subtitle: Text(detail.playlist.editLicense == EditLicense.open
                    ? 'Everyone who can see it can edit it'
                    : 'Only invited users can edit it'),
              ),
            ),
            if (controller.fromCache)
              const Padding(
                padding: EdgeInsets.only(top: 8),
                child: Text('Offline: showing the last synced copy.',
                    style: TextStyle(fontStyle: FontStyle.italic)),
              ),
            if (detail.tracks.isEmpty)
              const Expanded(
                  child: Center(child: Text('Empty playlist. Add a track!'))),
            if (detail.tracks.isNotEmpty)
              Expanded(
                child: ReorderableListView.builder(
                  padding: const EdgeInsets.fromLTRB(12, 12, 12, 88),
                  itemCount: detail.tracks.length,
                  buildDefaultDragHandles: false,
                  // ignore: deprecated_member_use
                  onReorder: (oldIndex, newIndex) async {
                    final track = detail.tracks[oldIndex];
                    final target =
                        newIndex > oldIndex ? newIndex - 1 : newIndex;
                    if (target == oldIndex) return;
                    final message = await controller.moveTrack(
                        track.id, target, track.version);
                    if (message != null) showMessage(message, error: true);
                  },
                  itemBuilder: (context, i) {
                    final t = detail.tracks[i];
                    return Card(
                      key: ValueKey(t.id),
                      child: ListTile(
                        leading: ReorderableDragStartListener(
                          index: i,
                          child: const Icon(Icons.drag_handle),
                        ),
                        title: Text(t.track.title),
                        subtitle: Text(t.track.artist),
                        trailing: IconButton(
                          tooltip: 'Remove',
                          icon: const Icon(Icons.delete_outline),
                          onPressed: () =>
                              runGuarded(() => controller.removeTrack(t.id)),
                        ),
                      ),
                    );
                  },
                ),
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
                          .read(playlistsRepositoryProvider)
                          .invite(playlistId, f.id),
                      success: '${f.displayName} invited',
                    );
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
                  () => controller.addTrack(title: title, artist: artist));
            },
            child: const Text('Add'),
          ),
        ],
      ),
    );
  }
}
