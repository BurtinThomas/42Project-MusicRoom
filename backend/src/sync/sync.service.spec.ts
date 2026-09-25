import { SyncService } from './sync.service';

describe('SyncService', () => {
  it('rejects a replayed vote whose location is not a coordinate', async () => {
    const events = { vote: jest.fn() };
    const service = new SyncService(events as any, {} as any);

    const [result] = await service.replay('user1', [
      {
        id: 'a1',
        type: 'event.vote',
        payload: {
          eventId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
          eventTrackId: '16fd2706-8baf-433b-82eb-8c7fada847da',
          lat: 'abc',
          lng: 2.3,
        },
      },
    ]);

    expect(result.status).toBe('error');
    expect(events.vote).not.toHaveBeenCalled();
  });

  it('replays a valid vote', async () => {
    const events = { vote: jest.fn().mockResolvedValue({ id: 'et1' }) };
    const service = new SyncService(events as any, {} as any);

    const [result] = await service.replay('user1', [
      {
        id: 'a1',
        type: 'event.vote',
        payload: {
          eventId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
          eventTrackId: '16fd2706-8baf-433b-82eb-8c7fada847da',
        },
      },
    ]);

    expect(result).toEqual({
      id: 'a1',
      status: 'applied',
      result: { id: 'et1' },
    });
  });
});
