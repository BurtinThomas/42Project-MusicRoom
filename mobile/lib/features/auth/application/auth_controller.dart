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

class AuthController extends StateNotifier<AuthState> {
  AuthController(this._ref) : super(const AuthState()) {
    _bootstrap();
  }

  final Ref _ref;
  AuthRepository get _repo => _ref.read(authRepositoryProvider);

  static const _googleServerClientId =
      '949617302313-gi9gdc533ti8st2tatakookeeujou0k8.apps.googleusercontent.com';

  // google_sign_in_web asserts that serverClientId is null (it's not
  // supported on web); passing it there permanently breaks the plugin's
  // init. The web client ID is auto-detected from the
  // google-signin-client_id meta tag in web/index.html instead.
  final GoogleSignIn googleSignIn = GoogleSignIn(
    scopes: const ['email'],
    serverClientId: kIsWeb ? null : _googleServerClientId,
  );

  Future<void> _bootstrap() async {
    final token = await TokenStorage.instance.accessToken;
    state = state.copyWith(
      status:
          token != null ? AuthStatus.authenticated : AuthStatus.unauthenticated,
    );
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
    state = state.copyWith(status: AuthStatus.authenticated);
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
    state = state.copyWith(status: AuthStatus.authenticated);
  }

  Future<void> logout() async {
    await _repo.logout();
    state = state.copyWith(status: AuthStatus.unauthenticated);
  }

  void forceLogout() {
    state = state.copyWith(status: AuthStatus.unauthenticated);
  }
}
