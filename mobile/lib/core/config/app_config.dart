import 'package:shared_preferences/shared_preferences.dart';

class AppConfig {
  AppConfig._();
  static final AppConfig instance = AppConfig._();

  static const _kBackendUrlKey = 'backend_base_url';
  static const defaultBackendUrl = 'http://localhost:3000';

  String _backendUrl = defaultBackendUrl;
  String get backendUrl => _backendUrl;

  String get wsEventsUrl => '$_backendUrl/ws/events';
  String get wsPlaylistsUrl => '$_backendUrl/ws/playlists';

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
