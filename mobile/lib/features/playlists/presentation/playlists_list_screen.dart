import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/models/playlist.dart';
import '../application/playlists_providers.dart';

class PlaylistsListScreen extends ConsumerWidget {
  const PlaylistsListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final playlistsAsync = ref.watch(playlistsListProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Music Playlist Editor')),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push('/playlists/create'),
        child: const Icon(Icons.add),
      ),
      body: playlistsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Failed to load playlists: $e')),
        data: (playlists) {
          if (playlists.isEmpty) {
            return const Center(child: Text('No playlists yet. Create one!'));
          }
          return ListView.builder(
            itemCount: playlists.length,
            itemBuilder: (context, i) {
              final p = playlists[i];
              return ListTile(
                leading: Icon(p.visibility == VisibilityLevel.public
                    ? Icons.public
                    : Icons.lock),
                title: Text(p.name),
                subtitle: Text(p.editLicense == EditLicense.open
                    ? 'Open editing'
                    : 'Invite-only editing'),
                trailing: p.requiresPaidPlan
                    ? const Icon(Icons.workspace_premium)
                    : null,
                onTap: () => context.push('/playlists/${p.id}'),
              );
            },
          );
        },
      ),
    );
  }
}
