import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'network/api_client.dart';
import 'network/socket_service.dart';
import 'storage/local_db.dart';
import 'config/app_config.dart';
import '../features/auth/application/auth_controller.dart';

final localDbProvider = Provider<LocalDb>((ref) => LocalDb());

final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient(
    onUnauthenticated: () =>
        ref.read(authControllerProvider.notifier).forceLogout(),
  );
});

final eventsSocketProvider = Provider<SocketChannel>((ref) {
  final channel = SocketChannel(AppConfig.wsEventsNamespace);
  ref.onDispose(channel.dispose);
  return channel;
});

final playlistsSocketProvider = Provider<SocketChannel>((ref) {
  final channel = SocketChannel(AppConfig.wsPlaylistsNamespace);
  ref.onDispose(channel.dispose);
  return channel;
});

final connectivityProvider = StreamProvider<bool>((ref) {
  return Connectivity()
      .onConnectivityChanged
      .map((results) => !results.contains(ConnectivityResult.none));
});
