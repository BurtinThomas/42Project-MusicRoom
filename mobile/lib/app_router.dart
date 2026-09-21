import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'features/auth/application/auth_controller.dart';
import 'features/auth/presentation/forgot_password_screen.dart';
import 'features/auth/presentation/login_screen.dart';
import 'features/auth/presentation/register_screen.dart';
import 'features/auth/presentation/reset_password_screen.dart';
import 'features/auth/presentation/verify_email_screen.dart';
import 'features/events/presentation/create_event_screen.dart';
import 'features/events/presentation/event_detail_screen.dart';
import 'features/events/presentation/events_list_screen.dart';
import 'features/friends/presentation/friends_screen.dart';
import 'features/playlists/presentation/create_playlist_screen.dart';
import 'features/playlists/presentation/playlist_detail_screen.dart';
import 'features/playlists/presentation/playlists_list_screen.dart';
import 'features/profile/presentation/profile_screen.dart';
import 'features/settings/presentation/settings_screen.dart';
import 'features/subscriptions/presentation/subscription_screen.dart';
import 'shared/widgets/home_shell.dart';

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/login',
    refreshListenable: _AuthListenable(ref),
    redirect: (context, state) {
      final status = ref.read(authControllerProvider).status;
      final loggingIn = state.matchedLocation == '/login' ||
          state.matchedLocation == '/register' ||
          state.matchedLocation.startsWith('/verify-email') ||
          state.matchedLocation.startsWith('/forgot-password') ||
          state.matchedLocation.startsWith('/reset-password');

      if (status == AuthStatus.unknown) return null;
      if (status == AuthStatus.unauthenticated && !loggingIn) return '/login';
      if (status == AuthStatus.authenticated && loggingIn) return '/home';
      return null;
    },
    routes: [
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      GoRoute(
          path: '/register',
          builder: (context, state) => const RegisterScreen()),
      GoRoute(
        path: '/verify-email',
        builder: (context, state) =>
            VerifyEmailScreen(email: state.extra as String? ?? ''),
      ),
      GoRoute(
          path: '/forgot-password',
          builder: (context, state) => const ForgotPasswordScreen()),
      GoRoute(
          path: '/reset-password',
          builder: (context, state) => const ResetPasswordScreen()),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) =>
            HomeShell(navigationShell: navigationShell),
        branches: [
          StatefulShellBranch(routes: [
            GoRoute(
              path: '/home',
              builder: (context, state) => const EventsListScreen(),
              routes: [
                GoRoute(
                    path: 'create',
                    builder: (context, state) => const CreateEventScreen()),
                GoRoute(
                  path: ':id',
                  builder: (context, state) =>
                      EventDetailScreen(eventId: state.pathParameters['id']!),
                ),
              ],
            ),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
              path: '/playlists',
              builder: (context, state) => const PlaylistsListScreen(),
              routes: [
                GoRoute(
                    path: 'create',
                    builder: (context, state) => const CreatePlaylistScreen()),
                GoRoute(
                  path: ':id',
                  builder: (context, state) => PlaylistDetailScreen(
                      playlistId: state.pathParameters['id']!),
                ),
              ],
            ),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
                path: '/friends',
                builder: (context, state) => const FriendsScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
              path: '/settings',
              builder: (context, state) => const SettingsScreen(),
              routes: [
                GoRoute(
                    path: 'profile',
                    builder: (context, state) => const ProfileScreen()),
                GoRoute(
                    path: 'subscription',
                    builder: (context, state) => const SubscriptionScreen()),
              ],
            ),
          ]),
        ],
      ),
    ],
  );
});

class _AuthListenable extends ChangeNotifier {
  _AuthListenable(this.ref) {
    ref.listen(authControllerProvider, (_, __) => notifyListeners());
  }
  final Ref ref;
}
