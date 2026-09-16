import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/models/playlist.dart';
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
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('New playlist')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            TextField(
                controller: _name,
                decoration: const InputDecoration(labelText: 'Playlist name')),
            const SizedBox(height: 16),
            const Text('VisibilityLevel'),
            SegmentedButton<VisibilityLevel>(
              segments: const [
                ButtonSegment(
                    value: VisibilityLevel.public, label: Text('Public')),
                ButtonSegment(
                    value: VisibilityLevel.private, label: Text('Private')),
              ],
              selected: {_visibility},
              onSelectionChanged: (s) => setState(() => _visibility = s.first),
            ),
            const SizedBox(height: 16),
            const Text('Who can edit'),
            SegmentedButton<EditLicense>(
              segments: const [
                ButtonSegment(value: EditLicense.open, label: Text('Everyone')),
                ButtonSegment(
                    value: EditLicense.inviteOnly, label: Text('Invited only')),
              ],
              selected: {_license},
              onSelectionChanged: (s) => setState(() => _license = s.first),
            ),
            if (_visibility == VisibilityLevel.public ||
                _license == EditLicense.open)
              const Padding(
                padding: EdgeInsets.only(top: 8),
                child: Text(
                  'Collaborative playlists require a paid subscription.',
                  style: TextStyle(fontStyle: FontStyle.italic),
                ),
              ),
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(_error!,
                  style: TextStyle(color: Theme.of(context).colorScheme.error)),
            ],
            const SizedBox(height: 24),
            FilledButton(
              onPressed: _saving ? null : _submit,
              child: _saving
                  ? const CircularProgressIndicator()
                  : const Text('Create'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _submit() async {
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      final playlist = await ref.read(playlistsRepositoryProvider).create(
            name: _name.text.trim(),
            visibility: _visibility,
            editLicense: _license,
          );
      ref.invalidate(playlistsListProvider);
      if (mounted) context.pushReplacement('/playlists/${playlist.id}');
    } on DioException catch (e) {
      setState(() => _error = e.response?.data?['message']?.toString() ??
          'Failed to create playlist');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }
}
