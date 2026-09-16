import 'dart:io';

import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

import 'local_db_types.dart';

part 'local_db_native.g.dart';

class CacheEntries extends Table {
  TextColumn get key => text()();
  TextColumn get jsonValue => text()();
  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {key};
}

class OutboxActions extends Table {
  TextColumn get id => text()();
  TextColumn get type => text()();
  TextColumn get payloadJson => text()();
  DateTimeColumn get createdAt => dateTime()();

  TextColumn get status => text().withDefault(const Constant('pending'))();
  TextColumn get lastError => text().nullable()();

  @override
  Set<Column> get primaryKey => {id};
}

@DriftDatabase(tables: [CacheEntries, OutboxActions])
class LocalDb extends _$LocalDb {
  LocalDb() : super(_openConnection());

  @override
  int get schemaVersion => 1;

  Future<void> putCache(String key, String jsonValue) {
    return into(cacheEntries).insertOnConflictUpdate(
      CacheEntriesCompanion.insert(
          key: key, jsonValue: jsonValue, updatedAt: DateTime.now()),
    );
  }

  Future<String?> getCache(String key) async {
    final row = await (select(cacheEntries)..where((t) => t.key.equals(key)))
        .getSingleOrNull();
    return row?.jsonValue;
  }

  Future<void> enqueueAction({
    required String id,
    required String type,
    required String payloadJson,
  }) {
    return into(outboxActions).insert(
      OutboxActionsCompanion.insert(
        id: id,
        type: type,
        payloadJson: payloadJson,
        createdAt: DateTime.now(),
      ),
    );
  }

  Future<List<OutboxActionData>> pendingActions() async {
    final rows = await (select(outboxActions)
          ..where((t) => t.status.equals('pending'))
          ..orderBy([(t) => OrderingTerm.asc(t.createdAt)]))
        .get();
    return rows
        .map((r) => OutboxActionData(
              id: r.id,
              type: r.type,
              payloadJson: r.payloadJson,
              createdAt: r.createdAt,
              status: r.status,
              lastError: r.lastError,
            ))
        .toList();
  }

  Future<void> markActionStatus(String id, String status, {String? error}) {
    return (update(outboxActions)..where((t) => t.id.equals(id))).write(
      OutboxActionsCompanion(status: Value(status), lastError: Value(error)),
    );
  }

  Future<void> clearAppliedActions() {
    return (delete(outboxActions)..where((t) => t.status.equals('applied')))
        .go();
  }
}

QueryExecutor _openConnection() {
  return LazyDatabase(() async {
    final dir = await getApplicationDocumentsDirectory();
    final file = File(p.join(dir.path, 'musicroom.sqlite'));
    return NativeDatabase.createInBackground(file);
  });
}
