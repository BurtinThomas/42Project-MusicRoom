import 'package:dio/dio.dart';
import '../config/app_config.dart';
import '../device/device_context.dart';
import '../storage/token_storage.dart';

class ApiClient {
  ApiClient({required this.onUnauthenticated}) {
    _dio = Dio(BaseOptions(connectTimeout: const Duration(seconds: 10)));
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        options.baseUrl = AppConfig.instance.backendUrl;
        final device = await DeviceContext.load();
        options.headers.addAll({
          'X-Client-Platform': device.platform,
          'X-Client-Device': device.model,
          'X-Client-App-Version': device.appVersion,
        });
        if (!_isPublicAuthCall(options.path)) {
          final token = await TokenStorage.instance.accessToken;
          if (token != null) options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) async {
        final isAuthCall = _isPublicAuthCall(error.requestOptions.path);
        if (error.response?.statusCode == 401 &&
            !isAuthCall &&
            !_isRetry(error.requestOptions)) {
          final refreshed = await _tryRefresh();
          if (refreshed) {
            try {
              final response =
                  await _dio.fetch(_markRetry(error.requestOptions));
              return handler.resolve(response);
            } catch (_) {}
          }
          await TokenStorage.instance.clear();
          onUnauthenticated();
        }
        handler.next(error);
      },
    ));
  }

  late final Dio _dio;
  final void Function() onUnauthenticated;
  Future<bool>? _refreshing;

  Dio get raw => _dio;

  static bool _isPublicAuthCall(String path) =>
      path.startsWith('/auth/') && !path.startsWith('/auth/link/');

  bool _isRetry(RequestOptions options) => options.extra['retried'] == true;
  RequestOptions _markRetry(RequestOptions options) {
    options.extra['retried'] = true;
    return options;
  }

  Future<bool> _tryRefresh() {
    _refreshing ??= _doRefresh().whenComplete(() => _refreshing = null);
    return _refreshing!;
  }

  Future<bool> _doRefresh() async {
    final refreshToken = await TokenStorage.instance.refreshToken;
    if (refreshToken == null) return false;
    try {
      final response = await _dio.post(
        '${AppConfig.instance.backendUrl}/auth/refresh',
        data: {'refreshToken': refreshToken},
      );
      await TokenStorage.instance.save(
        accessToken: response.data['accessToken'],
        refreshToken: response.data['refreshToken'],
      );
      return true;
    } catch (_) {
      return false;
    }
  }
}
