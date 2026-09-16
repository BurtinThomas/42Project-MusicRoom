import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../shared/widgets/key_value_editor.dart';
import '../application/profile_providers.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  Map<String, dynamic> _public = {};
  Map<String, dynamic> _friends = {};
  Map<String, dynamic> _private = {};
  Map<String, dynamic> _music = {};
  bool _saving = false;
  bool _initialized = false;

  @override
  Widget build(BuildContext context) {
    final profileAsync = ref.watch(myProfileProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('My profile')),
      body: profileAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Failed to load profile: $e')),
        data: (profile) {
          if (!_initialized) {
            _public = Map.of(profile.publicInfo);
            _friends = Map.of(profile.friendsInfo ?? {});
            _private = Map.of(profile.privateInfo ?? {});
            _music = Map.of(profile.musicPreferences);
            _initialized = true;
          }
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(profile.displayName,
                    style: Theme.of(context).textTheme.headlineSmall),
                const SizedBox(height: 24),
                _Section(
                  title: 'Public information',
                  subtitle: 'Visible to everyone',
                  child: KeyValueEditor(
                      initial: _public, onChanged: (m) => _public = m),
                ),
                _Section(
                  title: 'Friends-only information',
                  subtitle: 'Visible to accepted friends',
                  child: KeyValueEditor(
                      initial: _friends, onChanged: (m) => _friends = m),
                ),
                _Section(
                  title: 'Private information',
                  subtitle: 'Visible to you only',
                  child: KeyValueEditor(
                      initial: _private, onChanged: (m) => _private = m),
                ),
                _Section(
                  title: 'Music preferences',
                  subtitle: 'Genres, artists, moods...',
                  child: KeyValueEditor(
                      initial: _music, onChanged: (m) => _music = m),
                ),
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: _saving
                      ? null
                      : () async {
                          setState(() => _saving = true);
                          try {
                            await ref.read(profileRepositoryProvider).updateMe(
                                  publicInfo: _public,
                                  friendsInfo: _friends,
                                  privateInfo: _private,
                                  musicPreferences: _music,
                                );
                            ref.invalidate(myProfileProvider);
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                      content: Text('Profile updated')));
                            }
                          } finally {
                            if (mounted) setState(() => _saving = false);
                          }
                        },
                  child: _saving
                      ? const CircularProgressIndicator()
                      : const Text('Save'),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _Section extends StatelessWidget {
  const _Section(
      {required this.title, required this.subtitle, required this.child});
  final String title;
  final String subtitle;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(title, style: Theme.of(context).textTheme.titleMedium),
            Text(subtitle, style: Theme.of(context).textTheme.bodySmall),
            const SizedBox(height: 12),
            child,
          ],
        ),
      ),
    );
  }
}
