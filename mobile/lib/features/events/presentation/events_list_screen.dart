import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/models/event.dart';
import '../../../shared/api_error.dart';
import '../application/events_providers.dart';

class EventsListScreen extends ConsumerWidget {
  const EventsListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final eventsAsync = ref.watch(eventsListProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Music Track Vote — Events'),
        actions: [
          if (!kIsWeb)
            IconButton(
              tooltip: 'Nearby events (beacon scan)',
              icon: const Icon(Icons.sensors),
              onPressed: () => context.push('/home/nearby'),
            ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        tooltip: 'New event',
        onPressed: () => context.push('/home/create'),
        child: const Icon(Icons.add),
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(eventsListProvider.future),
        child: eventsAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => Center(
              child: Text('Failed to load events: ${apiErrorMessage(e)}')),
          data: (events) {
            if (events.isEmpty) {
              return const Center(child: Text('No events yet. Create one!'));
            }
            return ListView.builder(
              itemCount: events.length,
              itemBuilder: (context, i) {
                final e = events[i];
                return ListTile(
                  leading: Icon(e.visibility == VisibilityLevel.public
                      ? Icons.public
                      : Icons.lock),
                  title: Text(e.name),
                  subtitle: Text(describeLicense(e)),
                  onTap: () => context.push('/home/${e.id}'),
                );
              },
            );
          },
        ),
      ),
    );
  }
}
