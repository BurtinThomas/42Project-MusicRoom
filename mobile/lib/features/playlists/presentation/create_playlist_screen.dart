import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/models/playlist.dart';
import '../../../shared/api_error.dart';
import '../../subscriptions/application/subscriptions_providers.dart';
import '../application/playlists_providers.dart';

class CreatePlaylistScreen extends ConsumerStatefulWidget {
  const CreatePlaylistScreen({super.key});

  @override
  ConsumerState<CreatePlaylistScreen> createState() =>
      _CreatePlaylistScreenState();
}

class _CreatePlaylistScreenState extends ConsumerState<CreatePlaylistScreen> {
  final _name = TextEditingController();
  VisibilityLevel _visibility = VisibilityLevel.public;
  EditLicense _license = EditLicense.open;
  bool _saving = false;
  String? _error;

  @override
  void dispose() {
    _name.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final plan = ref.watch(myPlanProvider).value;
    final limitReached = plan != null && !plan.canCreatePlaylist;

    return Scaffold(
      appBar: AppBar(title: const Text('New playlist')),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 560),
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              TextField(
                  controller: _name,
                  decoration:
                      const InputDecoration(labelText: 'Playlist name')),
              const SizedBox(height: 16),
              const Text('Visibility'),
              const SizedBox(height: 4),
              SegmentedButton<VisibilityLevel>(
                segments: const [
                  ButtonSegment(
                      value: VisibilityLevel.public, label: Text('Public')),
                  ButtonSegment(
                      value: VisibilityLevel.private, label: Text('Private')),
                ],
                selected: {_visibility},
                onSelectionChanged: (s) =>
                    setState(() => _visibility = s.first),
              ),
              const SizedBox(height: 16),
              const Text('Who can edit'),
              const SizedBox(height: 4),
              SegmentedButton<EditLicense>(
                segments: const [
                  ButtonSegment(
                      value: EditLicense.open, label: Text('Everyone')),
                  ButtonSegment(
                      value: EditLicense.inviteOnly,
                      label: Text('Invited only')),
                ],
                selected: {_license},
                onSelectionChanged: (s) => setState(() => _license = s.first),
              ),
              if (limitReached) ...[
                const SizedBox(height: 16),
                Card(
                  child: ListTile(
                    leading: const Icon(Icons.workspace_premium),
                    title: Text('The Free plan is limited to '
                        '${plan.freePlaylistLimit} playlists'),
                    subtitle:
                        const Text('Switch to the Paid plan to create more.'),
                    trailing: TextButton(
                      onPressed: () => context.push('/settings/subscription'),
                      child: const Text('See plans'),
                    ),
                  ),
                ),
              ],
              if (_error != null) ...[
                const SizedBox(height: 12),
                Text(_error!,
                    style:
                        TextStyle(color: Theme.of(context).colorScheme.error)),
              ],
              const SizedBox(height: 24),
              FilledButton(
                onPressed: _saving ? null : _submit,
                child: _saving
                    ? const SizedBox(
                        height: 18,
                        width: 18,
                        child: CircularProgressIndicator(strokeWidth: 2))
                    : const Text('Create'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _submit() async {
    final name = _name.text.trim();
    if (name.isEmpty) {
      setState(() => _error = 'Give the playlist a name.');
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      final playlist = await ref.read(playlistsRepositoryProvider).create(
            name: name,
            visibility: _visibility,
            editLicense: _license,
          );
      ref.invalidate(playlistsListProvider);
      ref.invalidate(myPlanProvider);
      if (mounted) context.pushReplacement('/playlists/${playlist.id}');
    } catch (e) {
      setState(() => _error = apiErrorMessage(e));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }
}
