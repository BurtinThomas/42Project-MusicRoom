import 'dart:convert';

import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_sign_in/google_sign_in.dart';

import '../../../core/providers.dart';
import '../../../core/storage/token_storage.dart';
import '../data/auth_repository.dart';

enum AuthStatus { unknown, authenticated, unauthenticated }

class AuthState {
  const AuthState({this.status = AuthStatus.unknown});
  final AuthStatus status;

  AuthState copyWith({AuthStatus? status}) =>
      AuthState(status: status ?? this.status);
}

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(ref.watch(apiClientProvider));
});

final authControllerProvider =
    StateNotifierProvider<AuthController, AuthState>((ref) {
  return AuthController(ref);
});

final currentUserIdProvider = FutureProvider<String?>((ref) async {
  ref.watch(authControllerProvider);
  final token = await TokenStorage.instance.accessToken;
  if (token == null) return null;
  final parts = token.split('.');
  if (parts.length != 3) return null;
  final payload = utf8.decode(base64Url.decode(base64Url.normalize(parts[1])));
  return (jsonDecode(payload) as Map<String, dynamic>)['sub'] as String?;
});

class AuthController extends StateNotifier<AuthState> {
  AuthController(this._ref) : super(const AuthState()) {
    _bootstrap();
  }

  final Ref _ref;
  AuthRepository get _repo => _ref.read(authRepositoryProvider);

  static const _googleServerClientId =
      '949617302313-gi9gdc533ti8st2tatakookeeujou0k8.apps.googleusercontent.com';

  final GoogleSignIn googleSignIn = GoogleSignIn(
    scopes: const ['email'],
    serverClientId: kIsWeb ? null : _googleServerClientId,
  );

  Future<void> _bootstrap() async {
    final token = await TokenStorage.instance.accessToken;
    if (token != null) {
      _onLoggedIn();
    } else {
      state = state.copyWith(status: AuthStatus.unauthenticated);
    }
  }

  void _onLoggedIn() {
    state = state.copyWith(status: AuthStatus.authenticated);
  }

  Future<void> register({
    required String email,
    required String password,
    required String displayName,
  }) {
    return _repo.register(
        email: email, password: password, displayName: displayName);
  }

  Future<void> login({required String email, required String password}) async {
    await _repo.login(email: email, password: password);
    _onLoggedIn();
  }

  Future<void> loginWithGoogle() async {
    final account = await googleSignIn.signIn();
    if (account == null) return;
    await loginWithGoogleAccount(account);
  }

  Future<void> loginWithGoogleAccount(GoogleSignInAccount account) async {
    final auth = await account.authentication;
    final idToken = auth.idToken;
    if (idToken == null) {
      throw AuthException('Google did not return an identity token.');
    }
    await _repo.loginWithGoogle(idToken);
    _onLoggedIn();
  }

  Future<void> linkGoogle() async {
    final account = await googleSignIn.signIn();
    if (account == null) return;
    await linkGoogleAccount(account);
  }

  Future<void> linkGoogleAccount(GoogleSignInAccount account) async {
    final idToken = (await account.authentication).idToken;
    if (idToken == null) {
      throw AuthException('Google did not return an identity token.');
    }
    await _repo.linkGoogle(idToken);
  }

  Future<void> logout() async {
    await _repo.logout();
    try {
      await googleSignIn.signOut();
    } catch (_) {}
    state = state.copyWith(status: AuthStatus.unauthenticated);
  }

  void forceLogout() {
    state = state.copyWith(status: AuthStatus.unauthenticated);
  }
}
