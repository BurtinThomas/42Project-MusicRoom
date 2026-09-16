

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const POOL_SIZE = parseInt(__ENV.POOL_SIZE || '50', 10);
const EVENT_ID = __ENV.EVENT_ID;
const PLAYLIST_ID = __ENV.PLAYLIST_ID;

const voteTrend = new Trend('vote_duration');
const playlistTrend = new Trend('playlist_add_duration');

export const options = {
  scenarios: {
    ramp: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: Math.min(POOL_SIZE, 20) },
        { duration: '40s', target: POOL_SIZE },
        { duration: '20s', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<800'],
  },
};

const baseHeaders = {
  'Content-Type': 'application/json',
  'X-Client-Platform': 'ANDROID',
  'X-Client-Device': 'k6-load-test',
  'X-Client-App-Version': '1.0.0',
};

export function setup() {
  const tokens = [];
  for (let i = 0; i < POOL_SIZE; i++) {
    const res = http.post(
      `${BASE_URL}/auth/login`,
      JSON.stringify({ email: `loadtest${i}@musicroom.test`, password: 'password123' }),
      { headers: baseHeaders },
    );
    if (res.status === 201) {
      tokens.push(res.json('accessToken'));
    }
  }
  return { tokens };
}

export default function (data) {
  const token = data.tokens[__VU % data.tokens.length];
  const authHeaders = { ...baseHeaders, Authorization: `Bearer ${token}` };

  const eventDetail = http.get(`${BASE_URL}/events/${EVENT_ID}`, { headers: authHeaders });
  check(eventDetail, { 'event detail 200': (r) => r.status === 200 });
  const queue = eventDetail.json('queue');
  if (queue && queue.length > 0) {
    const track = queue[Math.floor(Math.random() * queue.length)];
    const voteRes = http.post(
      `${BASE_URL}/events/${EVENT_ID}/tracks/${track.id}/vote`,
      JSON.stringify({}),
      { headers: authHeaders },
    );
    voteTrend.add(voteRes.timings.duration);
    check(voteRes, { 'vote handled': (r) => [200, 201, 409].includes(r.status) });
  }

  const addRes = http.post(
    `${BASE_URL}/playlists/${PLAYLIST_ID}/tracks`,
    JSON.stringify({ title: `Load test track ${__VU}-${__ITER}`, artist: 'k6' }),
    { headers: authHeaders },
  );
  playlistTrend.add(addRes.timings.duration);
  check(addRes, { 'playlist add handled': (r) => [200, 201, 403].includes(r.status) });

  sleep(1);
}
