import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';

class LocationException implements Exception {
  LocationException(this.message);
  final String message;
  @override
  String toString() => message;
}

Future<({double lat, double lng})> currentPosition() async {
  if (!await Geolocator.isLocationServiceEnabled()) {
    throw LocationException('Location is turned off on this device.');
  }
  var permission = await Geolocator.checkPermission();
  if (permission == LocationPermission.denied) {
    permission = await Geolocator.requestPermission();
  }
  if (permission == LocationPermission.denied ||
      permission == LocationPermission.deniedForever) {
    throw LocationException('Location permission is required for this event.');
  }

  const timeLimit = Duration(seconds: 20);
  final settings = !kIsWeb && defaultTargetPlatform == TargetPlatform.android
      ? AndroidSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: timeLimit,
          forceLocationManager: true,
        )
      : const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: timeLimit,
        );

  try {
    final p = await Geolocator.getCurrentPosition(locationSettings: settings);
    return (lat: p.latitude, lng: p.longitude);
  } on TimeoutException {
    Position? last;
    try {
      last = await Geolocator.getLastKnownPosition(
          forceAndroidLocationManager: true);
    } catch (_) {}
    if (last != null) return (lat: last.latitude, lng: last.longitude);
    throw LocationException(
        'Could not get your position. Check that GPS is on and try again.');
  }
}
