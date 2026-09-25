import 'package:socket_io_client/socket_io_client.dart' as io;
import '../config/app_config.dart';
import '../storage/token_storage.dart';

class SocketChannel {
  SocketChannel(this.namespace);

  final String namespace;
  io.Socket? _socket;

  Future<io.Socket> connect() async {
    if (_socket != null && _socket!.connected) return _socket!;
    _socket?.dispose();
    final token = await TokenStorage.instance.accessToken;
    _socket = io.io(
      '${AppConfig.instance.backendUrl}$namespace',
      io.OptionBuilder()
          .setTransports(['websocket'])
          .setAuth({'token': token})
          .enableForceNew()
          .disableAutoConnect()
          .build(),
    );
    _socket!.connect();
    return _socket!;
  }

  void dispose() {
    _socket?.dispose();
    _socket = null;
  }
}
