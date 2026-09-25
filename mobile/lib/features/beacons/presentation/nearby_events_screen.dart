import 'package:flutter/material.dart';
import 'package:flutter_beacon/flutter_beacon.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:permission_handler/permission_handler.dart';

import '../application/beacons_providers.dart';
import '../data/beacon_service.dart';

class NearbyEventsScreen extends ConsumerStatefulWidget {
  const NearbyEventsScreen({super.key});

  @override
  ConsumerState<NearbyEventsScreen> createState() => _NearbyEventsScreenState();
}

class _NearbyEventsScreenState extends ConsumerState<NearbyEventsScreen> {
  final _uuidCtrl = TextEditingController(
    text: '2f234454-cf6d-4a0f-adf2-f4911ba9ffa6',
  );
  bool _scanning = false;
  String? _error;
  final List<NearbyEventInfo> _found = [];

  @override
  void dispose() {
    _uuidCtrl.dispose();
    super.dispose();
  }

  Future<bool> _ensurePermissions() async {
    final locationGranted = await flutterBeacon.requestAuthorization;
    if (!locationGranted) {
      setState(() => _error = 'Location permission is required to scan for '
          'beacons.');
      return false;
    }

    final statuses = await [
      Permission.bluetoothScan,
      Permission.bluetoothConnect,
    ].request();
    final bluetoothGranted =
        statuses.values.every((s) => s.isGranted || s.isLimited);
    if (!bluetoothGranted) {
      setState(() => _error = 'Bluetooth permission is required to scan for '
          'beacons.');
      return false;
    }

    return true;
  }

  Future<void> _start() async {
    setState(() => _error = null);

    final uuid = _uuidCtrl.text.trim();
    if (uuid.isEmpty) {
      setState(() => _error = 'Enter the event beacon\'s proximity UUID.');
      return;
    }

    if (!await _ensurePermissions()) return;

    try {
      final service = ref.read(beaconServiceProvider);
      await service.start(proximityUuid: uuid);
      service.nearbyEvents.listen((event) {
        if (!mounted) return;
        setState(() {
          if (!_found.any((e) => e.eventId == event.eventId)) {
            _found.add(event);
          }
        });
      });
      setState(() => _scanning = true);
    } catch (e) {
      setState(() => _error = 'Could not start scanning: $e');
    }
  }

  void _stop() {
    ref.read(beaconServiceProvider).stop();
    setState(() {
      _scanning = false;
      _found.clear();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Nearby events')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextField(
              controller: _uuidCtrl,
              enabled: !_scanning,
              decoration: const InputDecoration(
                labelText: 'Beacon proximity UUID',
                helperText: 'Set by the event owner for their beacon',
              ),
            ),
            const SizedBox(height: 12),
            FilledButton.icon(
              onPressed: _scanning ? _stop : _start,
              icon: Icon(_scanning ? Icons.stop : Icons.sensors),
              label: Text(_scanning ? 'Stop scanning' : 'Start scanning'),
            ),
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(_error!,
                  style: TextStyle(color: Theme.of(context).colorScheme.error)),
            ],
            const SizedBox(height: 24),
            Expanded(
              child: _found.isEmpty
                  ? Center(
                      child: Text(_scanning
                          ? 'Scanning… walk near an event\'s beacon.'
                          : 'No events detected yet.'),
                    )
                  : ListView.builder(
                      itemCount: _found.length,
                      itemBuilder: (context, i) {
                        final e = _found[i];
                        return ListTile(
                          leading: const Icon(Icons.event_available),
                          title: Text(e.name),
                          subtitle: Text(e.upNext.isEmpty
                              ? 'No track in the queue yet'
                              : 'Up next: ${e.upNext.map((t) => '${t.title} '
                                  '(${t.artist})').join(', ')}'),
                          trailing: const Icon(Icons.chevron_right),
                          onTap: () => context.push('/home/${e.eventId}'),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
