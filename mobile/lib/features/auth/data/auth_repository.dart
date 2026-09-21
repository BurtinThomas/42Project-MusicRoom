import 'package:dio/dio.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/token_storage.dart';

class AuthException implements Exception {
  AuthException(this.message, {this.code});
  final String message;
  final String? code;
  @override
  String toString() => message;
}

class AuthRepository {
  AuthRepository(this._api);
  final ApiClient _api;

  Future<void> register({
    required String email,
    required String password,
    required String displayName,
  }) async {
    try {
      await _api.raw.post('/auth/register', data: {
        'email': email,
        'password': password,
        'displayName': displayName,
      });
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  Future<void> login({required String email, required String password}) async {
    try {
      final response = await _api.raw.post('/auth/login', data: {
        'email': email,
        'password': password,
      });
      await _saveTokens(response.data);
    } on DioException catch (e) {
      if (e.response?.statusCode == 403 &&
          e.response?.data?['message'] == 'EMAIL_NOT_VERIFIED') {
        throw AuthException('Please verify your email before logging in.',
            code: 'EMAIL_NOT_VERIFIED');
      }
      throw _mapError(e);
    }
  }

  Future<void> loginWithGoogle(String idToken) async {
    try {
      final response =
          await _api.raw.post('/auth/google', data: {'idToken': idToken});
      await _saveTokens(response.data);
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  Future<void> linkGoogle(String idToken) async {
    try {
      await _api.raw.post('/auth/link/google', data: {'idToken': idToken});
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  Future<void> resendVerification(String email) async {
    try {
      await _api.raw.post('/auth/resend-verification', data: {'email': email});
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  Future<void> verifyEmail(String token) async {
    try {
      await _api.raw.post('/auth/verify-email', data: {'token': token});
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  Future<void> forgotPassword(String email) async {
    try {
      await _api.raw.post('/auth/forgot-password', data: {'email': email});
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  Future<void> resetPassword(
      {required String token, required String newPassword}) async {
    try {
      await _api.raw.post('/auth/reset-password',
          data: {'token': token, 'newPassword': newPassword});
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  Future<void> logout() async {
    final refreshToken = await TokenStorage.instance.refreshToken;
    if (refreshToken != null) {
      try {
        await _api.raw
            .post('/auth/logout', data: {'refreshToken': refreshToken});
      } catch (_) {}
    }
    await TokenStorage.instance.clear();
  }

  Future<void> _saveTokens(Map<String, dynamic> data) async {
    await TokenStorage.instance.save(
      accessToken: data['accessToken'] as String,
      refreshToken: data['refreshToken'] as String,
    );
  }

  AuthException _mapError(DioException e) {
    final data = e.response?.data;
    final rawMessage = data is Map ? data['message'] : null;
    final message = rawMessage is List
        ? rawMessage.first.toString()
        : rawMessage?.toString() ?? e.message ?? 'Network error';
    return AuthException(message);
  }
}
