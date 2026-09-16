import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/config/app_config.dart';
import '../../../core/device/device_context.dart';
import '../../../core/providers.dart';
import '../../auth/application/auth_controller.dart';
import '../../delegations/application/delegations_providers.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  late final TextEditingController _urlCtrl;

  @override
  void initState() {
    super.initState();
    _urlCtrl = TextEditingController(text: AppConfig.instance.backendUrl);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
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
          const Divider(height: 32),
          Text('Backend URL', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          TextField(
              controller: _urlCtrl,
              decoration: const InputDecoration(border: OutlineInputBorder())),
          const SizedBox(height: 8),
          FilledButton(
            onPressed: () async {
              await AppConfig.instance.setBackendUrl(_urlCtrl.text);
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                    content:
                        Text('Backend URL updated. Please log in again.')));
              }
            },
            child: const Text('Save backend URL'),
          ),
          const Divider(height: 40),
          Text('This device', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          FutureBuilder(
            future: DeviceContext.load(),
            builder: (context, snapshot) {
              final device = snapshot.data;
              if (device == null) return const CircularProgressIndicator();
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Platform: ${device.platform}'),
                  Text('Model: ${device.model}'),
                  Text('App version: ${device.appVersion}'),
                  const SizedBox(height: 8),
                  FilledButton.tonal(
                    onPressed: () async {
                      await _registerDevice(ref, device);
                      ref.invalidate(myDevicesProvider);
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Device registered')));
                      }
                    },
                    child: const Text('Register this device'),
                  ),
                ],
              );
            },
          ),
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

  Future<void> _registerDevice(WidgetRef ref, DeviceContext device) async {
    await ref.read(apiClientProvider).raw.post('/devices', data: {
      'installationId': device.installationId,
      'platform': device.platform,
      'model': device.model,
      'appVersion': device.appVersion,
    });
  }
}
