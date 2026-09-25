import 'dart:async';

import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_sign_in/google_sign_in.dart';

import '../../../core/config/app_config.dart';
import '../../../core/storage/token_storage.dart';
import '../../../shared/api_error.dart';
import '../../auth/application/auth_controller.dart';
import '../../auth/presentation/google_button.dart';
import '../../profile/application/profile_providers.dart';
import 'backend_url_dialog.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  StreamSubscription<GoogleSignInAccount?>? _googleSub;

  @override
  void initState() {
    super.initState();
    if (kIsWeb) {
      _googleSub = ref
          .read(authControllerProvider.notifier)
          .googleSignIn
          .onCurrentUserChanged
          .listen((account) {
        if (account != null) {
          _link(() => ref
              .read(authControllerProvider.notifier)
              .linkGoogleAccount(account));
        }
      });
    }
  }

  @override
  void dispose() {
    _googleSub?.cancel();
    super.dispose();
  }

  Future<void> _link(Future<void> Function() action) async {
    final ok = await runGuarded(action, success: 'Google account linked');
    if (ok) ref.invalidate(myProfileProvider);
  }

  Future<void> _changeBackendUrl() async {
    if (!await editBackendUrl(context)) return;
    await TokenStorage.instance.clear();
    ref.read(authControllerProvider.notifier).forceLogout();
    showMessage('Backend URL saved. Please log in again.');
  }

  @override
  Widget build(BuildContext context) {
    final profile = ref.watch(myProfileProvider).value;
    final googleLinked = profile?.linkedProviders.contains('GOOGLE') ?? false;

    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (profile != null)
            ListTile(
              leading: const Icon(Icons.account_circle),
              title: Text(profile.displayName),
              subtitle: Text(profile.email ?? ''),
            ),
          ListTile(
            leading: const Icon(Icons.person_outline),
            title: const Text('My profile'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.push('/settings/profile'),
          ),
          ListTile(
            leading: const Icon(Icons.workspace_premium_outlined),
            title: const Text('Subscription'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.push('/settings/subscription'),
          ),
          ListTile(
            leading: const Icon(Icons.dns_outlined),
            title: const Text('Backend URL'),
            subtitle: Text(AppConfig.instance.backendUrl),
            trailing: const Icon(Icons.edit),
            onTap: _changeBackendUrl,
          ),
          const Divider(height: 32),
          Text('Linked accounts',
              style: Theme.of(context).textTheme.titleMedium),
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: const Icon(Icons.g_mobiledata, size: 32),
            title: const Text('Google'),
            subtitle: Text(googleLinked
                ? 'Linked: you can also sign in with Google'
                : 'Not linked'),
            trailing: googleLinked
                ? const Icon(Icons.check_circle, color: Colors.green)
                : kIsWeb
                    ? null
                    : OutlinedButton(
                        onPressed: () => _link(() => ref
                            .read(authControllerProvider.notifier)
                            .linkGoogle()),
                        child: const Text('Link'),
                      ),
          ),
          if (kIsWeb && !googleLinked && profile != null)
            Align(alignment: Alignment.centerLeft, child: googleSignInButton()),
          const Divider(height: 40),
          FilledButton.tonalIcon(
            style: FilledButton.styleFrom(
                foregroundColor: Theme.of(context).colorScheme.error),
            onPressed: () async {
              await ref.read(authControllerProvider.notifier).logout();
              if (context.mounted) context.go('/login');
            },
            icon: const Icon(Icons.logout),
            label: const Text('Log out'),
          ),
        ],
      ),
    );
  }
}
