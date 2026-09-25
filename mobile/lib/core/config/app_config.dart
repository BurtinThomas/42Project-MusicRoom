import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AppConfig {
  AppConfig._();
  static final AppConfig instance = AppConfig._();

  static const _kBackendUrlKey = 'backend_base_url';

  static String get defaultBackendUrl {
    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:3000';
    }
    return 'http://localhost:3000';
  }

  String _backendUrl = defaultBackendUrl;
  String get backendUrl => _backendUrl;

  static const wsEventsNamespace = '/ws/events';
  static const wsPlaylistsNamespace = '/ws/playlists';

  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    _backendUrl = prefs.getString(_kBackendUrlKey) ?? defaultBackendUrl;
  }

  Future<void> setBackendUrl(String url) async {
    final normalized = url.trim().replaceAll(RegExp(r'/+$'), '');
    _backendUrl = normalized.isEmpty ? defaultBackendUrl : normalized;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_kBackendUrlKey, _backendUrl);
  }
}
