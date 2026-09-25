import 'dart:io' show Platform;

import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:package_info_plus/package_info_plus.dart';

class DeviceContext {
  DeviceContext._({
    required this.platform,
    required this.model,
    required this.appVersion,
  });

  final String platform;
  final String model;
  final String appVersion;

  static DeviceContext? _cached;

  static Future<DeviceContext> load() async {
    if (_cached != null) return _cached!;

    final packageInfo = await PackageInfo.fromPlatform();
    final deviceInfo = DeviceInfoPlugin();

    String platform;
    String model;
    if (kIsWeb) {
      platform = 'WEB';
      final web = await deviceInfo.webBrowserInfo;
      model = web.browserName.name;
    } else if (Platform.isAndroid) {
      platform = 'ANDROID';
      final android = await deviceInfo.androidInfo;
      model = '${android.manufacturer} ${android.model}';
    } else {
      platform = 'UNKNOWN';
      model = 'unknown';
    }

    _cached = DeviceContext._(
      platform: platform,
      model: model,
      appVersion: packageInfo.version,
    );
    return _cached!;
  }
}
