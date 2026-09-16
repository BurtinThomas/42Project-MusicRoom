import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/models/event.dart';
import '../application/events_providers.dart';

class CreateEventScreen extends ConsumerStatefulWidget {
  const CreateEventScreen({super.key});

  @override
  ConsumerState<CreateEventScreen> createState() => _CreateEventScreenState();
}

class _CreateEventScreenState extends ConsumerState<CreateEventScreen> {
  final _name = TextEditingController();
  VisibilityLevel _visibility = VisibilityLevel.public;
  VoteLicense _license = VoteLicense.open;
  bool _saving = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('New event')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            TextField(
                controller: _name,
                decoration: const InputDecoration(labelText: 'Event name')),
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
            const Text('Who can vote'),
            SegmentedButton<VoteLicense>(
              segments: const [
                ButtonSegment(value: VoteLicense.open, label: Text('Everyone')),
                ButtonSegment(
                    value: VoteLicense.inviteOnly, label: Text('Invited only')),
                ButtonSegment(
                    value: VoteLicense.locationTime,
                    label: Text('Location/time')),
              ],
              selected: {_license},
              onSelectionChanged: (s) => setState(() => _license = s.first),
            ),
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
    setState(() => _saving = true);
    try {
      final event = await ref.read(eventsRepositoryProvider).create(
            name: _name.text.trim(),
            visibility: _visibility,
            voteLicense: _license,
          );
      ref.invalidate(eventsListProvider);
      if (mounted) context.pushReplacement('/home/${event.id}');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }
}
