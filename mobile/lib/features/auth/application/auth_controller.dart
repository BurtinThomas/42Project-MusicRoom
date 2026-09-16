import 'package:flutter_facebook_auth/flutter_facebook_auth.dart';
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
    final googleSignIn = GoogleSignIn(scopes: const ['email']);
    final account = await googleSignIn.signIn();
    if (account == null) return;
    final auth = await account.authentication;
    final idToken = auth.idToken;
    if (idToken == null) {
      throw AuthException('Google did not return an identity token.');
    }
    await _repo.loginWithGoogle(idToken);
    state = state.copyWith(status: AuthStatus.authenticated);
  }

  Future<void> loginWithFacebook() async {
    final result = await FacebookAuth.instance
        .login(permissions: const ['email', 'public_profile']);
    if (result.status != LoginStatus.success || result.accessToken == null) {
      if (result.status == LoginStatus.cancelled) return;
      throw AuthException(result.message ?? 'Facebook login failed.');
    }
    await _repo.loginWithFacebook(result.accessToken!.tokenString);
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
