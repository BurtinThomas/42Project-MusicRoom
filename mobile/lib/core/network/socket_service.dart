import 'package:socket_io_client/socket_io_client.dart' as io;
import '../storage/token_storage.dart';

class SocketChannel {
  SocketChannel(this.url);

  final String url;
  io.Socket? _socket;

  Future<io.Socket> connect() async {
    if (_socket != null && _socket!.connected) return _socket!;
    final token = await TokenStorage.instance.accessToken;
    _socket = io.io(
      url,
      io.OptionBuilder()
          .setTransports(['websocket'])
          .setAuth({'token': token})
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
