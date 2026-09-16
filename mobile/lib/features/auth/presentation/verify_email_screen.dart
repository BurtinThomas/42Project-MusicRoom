import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../application/auth_controller.dart';

class VerifyEmailScreen extends ConsumerStatefulWidget {
  const VerifyEmailScreen({super.key, required this.email});
  final String email;

  @override
  ConsumerState<VerifyEmailScreen> createState() => _VerifyEmailScreenState();
}

class _VerifyEmailScreenState extends ConsumerState<VerifyEmailScreen> {
  final _token = TextEditingController();
  bool _loading = false;
  String? _message;

  Future<void> _verify() async {
    setState(() => _loading = true);
    try {
      await ref.read(authRepositoryProvider).verifyEmail(_token.text.trim());
      setState(() => _message = 'Email verified! You can now log in.');
      await Future.delayed(const Duration(seconds: 1));
      if (mounted) context.go('/login');
    } catch (e) {
      setState(() => _message = 'Invalid or expired code.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _resend() async {
    setState(() => _loading = true);
    try {
      await ref.read(authRepositoryProvider).resendVerification(widget.email);
      setState(() => _message = 'Verification email sent to ${widget.email}.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Verify your email')),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 420),
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text('We sent a verification code to ${widget.email}.'),
                const SizedBox(height: 16),
                TextField(
                  controller: _token,
                  decoration:
                      const InputDecoration(labelText: 'Verification code'),
                ),
                if (_message != null) ...[
                  const SizedBox(height: 12),
                  Text(_message!),
                ],
                const SizedBox(height: 20),
                FilledButton(
                    onPressed: _loading ? null : _verify,
                    child: const Text('Verify')),
                TextButton(
                    onPressed: _loading ? null : _resend,
                    child: const Text('Resend code')),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
