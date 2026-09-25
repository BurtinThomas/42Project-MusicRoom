import 'package:dio/dio.dart';
import 'package:flutter/material.dart';

final rootMessengerKey = GlobalKey<ScaffoldMessengerState>();

bool isConnectionError(Object error) =>
    error is DioException &&
    (error.type == DioExceptionType.connectionError ||
        error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.unknown);

String apiErrorMessage(Object error) {
  if (error is DioException) {
    if (isConnectionError(error)) return 'Cannot reach the server.';
    final data = error.response?.data;
    final message = data is Map ? data['message'] : null;
    if (message is List && message.isNotEmpty) return message.first.toString();
    if (message != null) return message.toString();
    return 'Request failed (${error.response?.statusCode ?? 'no response'}).';
  }
  return error.toString();
}

void showMessage(String message, {bool error = false}) {
  final messenger = rootMessengerKey.currentState;
  if (messenger == null) return;
  messenger
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(
      content: Text(message),
      backgroundColor: error ? Colors.red.shade700 : null,
    ));
}

Future<bool> runGuarded(Future<void> Function() action,
    {String? success}) async {
  try {
    await action();
    if (success != null) showMessage(success);
    return true;
  } catch (e) {
    showMessage(apiErrorMessage(e), error: true);
    return false;
  }
}
