import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/models/event.dart';
import '../application/events_providers.dart';

class EventsListScreen extends ConsumerWidget {
  const EventsListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final eventsAsync = ref.watch(eventsListProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Music Track Vote — Events')),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push('/home/create'),
        child: const Icon(Icons.add),
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(eventsListProvider.future),
        child: eventsAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => Center(child: Text('Failed to load events: $e')),
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
                  subtitle: Text(_licenseLabel(e.voteLicense)),
                  onTap: () => context.push('/home/${e.id}'),
                );
              },
            );
          },
        ),
      ),
    );
  }

  String _licenseLabel(VoteLicense l) {
    switch (l) {
      case VoteLicense.open:
        return 'Anyone can vote';
      case VoteLicense.inviteOnly:
        return 'Invite-only voting';
      case VoteLicense.locationTime:
        return 'Location & time restricted voting';
    }
  }
}
