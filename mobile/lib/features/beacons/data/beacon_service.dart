import 'dart:async';

import 'package:flutter_beacon/flutter_beacon.dart';

import '../../../core/models/track.dart';
import '../../../core/network/api_client.dart';

class NearbyEventInfo {
  NearbyEventInfo(
      {required this.eventId, required this.name, required this.upNext});
  final String eventId;
  final String name;
  final List<Track> upNext;
}

class BeaconService {
  BeaconService(this._api);
  final ApiClient _api;

  StreamSubscription<RangingResult>? _subscription;
  final _controller = StreamController<NearbyEventInfo>.broadcast();
  final _seen = <String>{};

  Stream<NearbyEventInfo> get nearbyEvents => _controller.stream;

  Future<void> start({required String proximityUuid}) async {
    await flutterBeacon.initializeScanning;
    final region =
        Region(identifier: 'musicroom', proximityUUID: proximityUuid);

    _subscription = flutterBeacon.ranging([region]).listen((result) async {
      for (final beacon in result.beacons) {
        final key = '${beacon.proximityUUID}-${beacon.major}-${beacon.minor}';
        if (_seen.contains(key)) continue;

        try {
          final response = await _api.raw.post('/beacons/scan', data: {
            'uuid': beacon.proximityUUID,
            'major': beacon.major,
            'minor': beacon.minor,
          });
          _seen.add(key);
          _controller.add(NearbyEventInfo(
            eventId: response.data['eventId'],
            name: response.data['name'],
            upNext: [
              for (final t in response.data['upNext'] as List)
                Track.fromJson(Map<String, dynamic>.from(t))
            ],
          ));
        } catch (_) {}
      }
    });
  }

  void stop() {
    _subscription?.cancel();
    _subscription = null;
    _seen.clear();
  }

  void dispose() {
    stop();
    _controller.close();
  }
}
