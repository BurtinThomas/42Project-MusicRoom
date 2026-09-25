import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:musicroom_mobile/core/models/event.dart';
import 'package:musicroom_mobile/features/events/application/events_providers.dart';
import 'package:musicroom_mobile/shared/api_error.dart';

DioException _httpError(int status, Object data) => DioException(
      requestOptions: RequestOptions(path: '/x'),
      type: DioExceptionType.badResponse,
      response: Response(
          requestOptions: RequestOptions(path: '/x'),
          statusCode: status,
          data: data),
    );

void main() {
  group('apiErrorMessage', () {
    test('shows the backend message', () {
      expect(apiErrorMessage(_httpError(409, {'message': 'You already voted'})),
          'You already voted');
    });

    test('shows the first validation error of a list', () {
      expect(
          apiErrorMessage(_httpError(400, {
            'message': ['title should not be empty', 'artist too short']
          })),
          'title should not be empty');
    });

    test('recognizes an unreachable server as a connection error', () {
      final e = DioException(
          requestOptions: RequestOptions(path: '/x'),
          type: DioExceptionType.connectionError);
      expect(isConnectionError(e), isTrue);
      expect(isConnectionError(_httpError(500, {})), isFalse);
      expect(apiErrorMessage(e), 'Cannot reach the server.');
    });
  });

  test('EventTrack reads votedByMe and defaults it to false', () {
    final base = {
      'id': 'et1',
      'eventId': 'e1',
      'score': 3,
      'track': {'id': 't1', 'title': 'Song', 'artist': 'Band'},
    };
    expect(EventTrack.fromJson(base).votedByMe, isFalse);
    expect(EventTrack.fromJson({...base, 'votedByMe': true}).votedByMe, isTrue);
  });

  test('describeLicense explains a place & time license', () {
    final event = MusicEvent.fromJson({
      'id': 'e1',
      'ownerId': 'u1',
      'name': 'Party',
      'visibility': 'PUBLIC',
      'voteLicense': 'LOCATION_TIME',
      'locationLat': 48.9,
      'locationLng': 2.3,
      'locationRadiusM': 150,
      'voteWindowStart': '2026-09-25T14:00:00.000Z',
      'voteWindowEnd': '2026-09-25T16:00:00.000Z',
    });
    expect(describeLicense(event), contains('150 m'));
  });
}
