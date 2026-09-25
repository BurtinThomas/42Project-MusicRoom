import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/models/plan.dart';
import '../../../core/providers.dart';
import '../data/subscriptions_repository.dart';

final subscriptionsRepositoryProvider = Provider<SubscriptionsRepository>(
    (ref) => SubscriptionsRepository(ref.watch(apiClientProvider)));

final myPlanProvider = FutureProvider.autoDispose<Plan>(
    (ref) => ref.watch(subscriptionsRepositoryProvider).myPlan());
