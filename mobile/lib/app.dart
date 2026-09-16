import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app_router.dart';
import 'core/theme/app_theme.dart';
import 'features/offline/application/offline_providers.dart';

class MusicRoomApp extends ConsumerWidget {
  const MusicRoomApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.watch(autoSyncProvider);
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: 'Music Room',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      routerConfig: router,
    );
  }
}
