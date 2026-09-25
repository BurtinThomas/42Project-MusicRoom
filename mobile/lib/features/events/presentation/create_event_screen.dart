import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/location/current_position.dart';
import '../../../core/models/event.dart';
import '../../../shared/api_error.dart';
import '../application/events_providers.dart';

class CreateEventScreen extends ConsumerStatefulWidget {
  const CreateEventScreen({super.key});

  @override
  ConsumerState<CreateEventScreen> createState() => _CreateEventScreenState();
}

class _CreateEventScreenState extends ConsumerState<CreateEventScreen> {
  final _name = TextEditingController();
  final _radius = TextEditingController(text: '200');
  VisibilityLevel _visibility = VisibilityLevel.public;
  VoteLicense _license = VoteLicense.open;
  ({double lat, double lng})? _location;
  late DateTime _start = DateTime.now();
  late DateTime _end = _start.add(const Duration(hours: 2));
  bool _locating = false;
  bool _saving = false;
  String? _error;

  @override
  void dispose() {
    _name.dispose();
    _radius.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('New event')),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 560),
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              TextField(
                  controller: _name,
                  decoration: const InputDecoration(labelText: 'Event name')),
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
              const Text('Who can vote'),
              const SizedBox(height: 4),
              SegmentedButton<VoteLicense>(
                segments: const [
                  ButtonSegment(
                      value: VoteLicense.open, label: Text('Everyone')),
                  ButtonSegment(
                      value: VoteLicense.inviteOnly,
                      label: Text('Invited only')),
                  ButtonSegment(
                      value: VoteLicense.locationTime,
                      label: Text('Place & time')),
                ],
                selected: {_license},
                onSelectionChanged: (s) => setState(() => _license = s.first),
              ),
              if (_license == VoteLicense.locationTime)
                ..._locationTimeFields(),
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

  List<Widget> _locationTimeFields() => [
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text('Only people at the venue during the time window '
                    'can vote.'),
                const SizedBox(height: 12),
                OutlinedButton.icon(
                  onPressed: _locating ? null : _useMyLocation,
                  icon: const Icon(Icons.my_location),
                  label: Text(_location == null
                      ? 'Use my current location as the venue'
                      : 'Venue: ${_location!.lat.toStringAsFixed(5)}, '
                          '${_location!.lng.toStringAsFixed(5)}'),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _radius,
                  keyboardType: TextInputType.number,
                  decoration:
                      const InputDecoration(labelText: 'Radius (meters)'),
                ),
                const SizedBox(height: 8),
                _DateTimeTile(
                    label: 'Voting opens',
                    value: _start,
                    onChanged: (d) => setState(() => _start = d)),
                _DateTimeTile(
                    label: 'Voting closes',
                    value: _end,
                    onChanged: (d) => setState(() => _end = d)),
              ],
            ),
          ),
        ),
      ];

  Future<void> _useMyLocation() async {
    setState(() => _locating = true);
    try {
      final pos = await currentPosition();
      setState(() => _location = pos);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _locating = false);
    }
  }

  Future<void> _submit() async {
    final name = _name.text.trim();
    final radius = int.tryParse(_radius.text.trim());
    String? error;
    if (name.isEmpty) {
      error = 'Give the event a name.';
    } else if (_license == VoteLicense.locationTime) {
      if (_location == null) error = 'Set the venue location.';
      if (radius == null || radius <= 0) error = 'Enter a valid radius.';
      if (!_end.isAfter(_start)) error = 'Voting must close after it opens.';
    }
    setState(() => _error = error);
    if (error != null) return;

    setState(() => _saving = true);
    try {
      final isGeo = _license == VoteLicense.locationTime;
      final event = await ref.read(eventsRepositoryProvider).create(
            name: name,
            visibility: _visibility,
            voteLicense: _license,
            locationLat: isGeo ? _location!.lat : null,
            locationLng: isGeo ? _location!.lng : null,
            locationRadiusM: isGeo ? radius : null,
            voteWindowStart: isGeo ? _start.toUtc() : null,
            voteWindowEnd: isGeo ? _end.toUtc() : null,
          );
      ref.invalidate(eventsListProvider);
      if (mounted) context.pushReplacement('/home/${event.id}');
    } catch (e) {
      setState(() => _error = apiErrorMessage(e));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }
}

class _DateTimeTile extends StatelessWidget {
  const _DateTimeTile(
      {required this.label, required this.value, required this.onChanged});
  final String label;
  final DateTime value;
  final ValueChanged<DateTime> onChanged;

  @override
  Widget build(BuildContext context) {
    final l = MaterialLocalizations.of(context);
    return ListTile(
      contentPadding: EdgeInsets.zero,
      title: Text(label),
      subtitle: Text('${l.formatMediumDate(value)} '
          '${l.formatTimeOfDay(TimeOfDay.fromDateTime(value))}'),
      trailing: const Icon(Icons.edit_calendar),
      onTap: () async {
        final date = await showDatePicker(
          context: context,
          initialDate: value,
          firstDate: DateTime.now().subtract(const Duration(days: 1)),
          lastDate: DateTime.now().add(const Duration(days: 365)),
        );
        if (date == null || !context.mounted) return;
        final time = await showTimePicker(
            context: context, initialTime: TimeOfDay.fromDateTime(value));
        if (time == null) return;
        onChanged(
            DateTime(date.year, date.month, date.day, time.hour, time.minute));
      },
    );
  }
}
