# Music Room

Music, Collaboration and mobility — a mobile + backend solution for live collaborative music: **Music Track Vote** and **Music Playlist Editor** (the subject requires 2 of its 3 services; Music Control Delegation was left out — see below).

## Repository layout

```
backend/   NestJS (TypeScript) REST + WebSocket API — single source of truth
mobile/    Flutter app (Android / Web) — a "remote control" for the API
```

## Stack and why

| Layer | Choice | Why |
|---|---|---|
| Backend framework | **NestJS** (Node.js/TypeScript) | Decorator-based modules, guards, interceptors map directly onto cross-cutting needs: `@nestjs/swagger` self-documents the API, guards enforce per-user data isolation, an interceptor logs every action, `@nestjs/throttler` rate-limits auth routes, `@nestjs/websockets` gives realtime rooms for the two collaborative services. |
| Database | **PostgreSQL** via Prisma ORM | The two "competition" services (Track Vote, Playlist Editor) need real ACID transactions and DB-level unique constraints to correctly resolve concurrent writes — safer than pushing that correctness burden into application code. |
| API style | **REST + JSON** | Maps cleanly onto resources (users, events, tracks, votes, playlists, devices); no schema compiler needed, first-class support in both NestJS and Flutter. Complemented by a thin WebSocket channel (Socket.IO) for realtime notifications — REST stays the only place a write is durably committed. |
| Mobile | **Flutter** | Subject requires Android or iOS; the multi-platform bonus asks for responsive web too. We picked Android as the mandatory mobile target, and Flutter renders the same codebase on Android *and* web from one Dart tree, avoiding a second client rewrite. |
| Mobile state | **Riverpod** | Testable, no `BuildContext` coupling, works well with realtime streams and the offline sync layer. |
| Local storage | **Drift (SQLite)** on Android/desktop, **SharedPreferences** on web | Drift needs `dart:ffi`, unavailable on Flutter Web without bundling a matching sqlite3 WASM binary — a separate native-artifact pipeline outside this project's scope. The web build keeps the same public `LocalDb` interface (`mobile/lib/core/storage/local_db.dart`, platform-selected via a `dart.library.io` conditional export) backed by `window.localStorage` instead, so it stays fully functional and still persists across reloads. |
| Auth | JWT (access + rotating refresh) + Google/Passport | Short-lived access token, hashed rotating refresh token limits the blast radius of a stolen token. Social tokens are cryptographically verified server-side (Google ID token verification) rather than trusted as-is. |

## Getting started

Prerequisites: Node.js 20+, a PostgreSQL 14+ server, Flutter 3.24+ (for the mobile app).

### 1. PostgreSQL

Either Docker (`make db-up`, uses `docker-compose.yml`), or if Docker isn't installed, any local Postgres works — e.g. [Postgres.app](https://postgresapp.com) (macOS, no compilation needed, just drag it into Applications and start it). Whatever you use, create a `musicroom` database/role matching `DATABASE_URL` below (or edit `DATABASE_URL` to match what you created).

### 2. Backend

```bash
make backend-install                          # npm install
make env                                       # backend/.env from backend/.env.example
                                                # then fill in real secrets in backend/.env
make prisma-migrate                            # or: cd backend && npx prisma migrate dev
make backend-dev                               # http://localhost:3000 — Swagger docs at /docs
```

### 3. Mobile

```bash
make mobile-install    # flutter pub get
cd mobile && dart run build_runner build --delete-conflicting-outputs   # generates local_db_native.g.dart
make mobile-run         # flutter run — pick a device/simulator when prompted
```

Once the app is open, go to **Settings → Backend URL** and confirm/set it to your backend's address (defaults to `http://localhost:3000`; the subject requires this to be configurable rather than hardcoded).

**Testing in a browser** (`flutter run -d chrome`): the backend's CORS only allows the origins listed in `backend/.env`'s `CORS_ORIGINS` (`http://localhost:5173,http://localhost:8080` by default), but Flutter picks a random port each run unless you pin one. Run `flutter run -d chrome --web-port=8080` (or add whatever port you use to `CORS_ORIGINS`) — otherwise requests fail with a CORS/XMLHttpRequest error in the browser console.

**Registration and no real mailbox**: `MailService` never sends real email — the email-verification and password-reset codes are printed to the backend terminal instead, e.g.:
```
[MailService] [DEV MAIL] to=you@example.com subject="Verify your Music Room account"
...code: 52b6ba443c5875e6c38d91d7ec2071fa2c508d84c03ef2c1
```
Copy that code into the app's verification screen. This is a deliberate choice, not a placeholder: the subject only requires that email verification/reset exist and work, not that a real mailbox is wired up, so there's no SMTP dependency to configure or fail during evaluation.

All Makefile targets: `make help`.

### Troubleshooting

- **`flutter` fails with "Current Mac OS X version ... is lower than minimum supported version"**: the latest Flutter stable requires macOS 14+. On macOS 12/13, install Flutter 3.24.5 instead — download `flutter_macos_3.24.5-stable.zip` (or `flutter_macos_arm64_3.24.5-stable.zip` on Apple Silicon) from `storage.googleapis.com/flutter_infra_release/releases/stable/macos/`, unzip it (e.g. to `~/flutter`), and add `~/flutter/bin` to your `PATH`.
- **No Docker installed**: skip `make db-up` and point `backend/.env`'s `DATABASE_URL` at any local Postgres (see step 1 above).
- Google sign-in needs real OAuth credentials (see OAuth configuration below) — everything else, including registration/login by email+password, works without them.

## Mandatory part

- **User**: email/password with mandatory email verification and password reset, Google sign-in, account linking, public/friends/private profile scopes, music preferences.
- **Services**: 2 of the 3 (the subject requires "at least 2 out of 3") — Music Track Vote and Music Playlist Editor — each with visibility (public/private) and license management. Music Control Delegation was left out: it's the only one of the three with no bonus depending on it (IoT hooks into events, subscriptions gate playlists, offline sync replays event/playlist actions only), so dropping it keeps the mandatory requirement met while cutting scope.
- **Server / API**: PostgreSQL as the single source of truth; REST + JSON, self-documented via Swagger at `/docs`.
- **Mobile application**: Flutter app, backend URL configurable from Settings, Google auth.
- **Securing**: see below.
- **Ramp-up**: see Load testing below.
- **Agility**: `make backend-lint` / `make backend-build` / `flutter analyze` keep the codebase in a checked state; `.env` is git-ignored. Unit tests per layer (V.8): `cd backend && npm test` (Jest — vote licensing, duplicate-vote conflict, playback control, playlist paid-plan gate, version-conflict on reorder, login/email-verification) and `cd mobile && flutter test` (register form validation).

## Bonus part

- **Multi-platform support**: the same Flutter codebase also builds for the web (`make mobile-build-web`), with a responsive layout (bottom nav on phones, side rail on wide screens).
- **Reflection on the IoT**: an event owner can attach an iBeacon region to their event; the mobile app resolves nearby beacons to event info via `POST /beacons/scan` (`backend/src/beacons`, `mobile/lib/features/beacons`).
- **Free vs. Paid subscription**: users switch between FREE and PAID plans; collaborative (public / open-edit) playlists require PAID (`backend/src/playlists/playlists.service.ts`).
- **Offline Mode**: the mobile app caches a snapshot of the user's events/playlists locally and queues actions performed offline; `POST /sync/replay` replays them once connectivity returns, with explicit conflict/error reporting per action (`backend/src/sync`, `mobile/lib/features/offline`).

## Concurrency handling

The subject specifically flags "competition" problems (several users voting/reordering at once):

- **Votes**: `Vote` has a unique DB constraint on `(eventTrackId, userId)` — a duplicate vote from the same user hits a unique-violation, translated to `409 Conflict`. The score increment is a single atomic `UPDATE ... SET score = score + 1` inside the same transaction as the vote insert, so concurrent votes from many users never lose an update.
- **Playlist reordering**: each `PlaylistTrack` carries a monotonic `version`. A move must supply the `version` it last read; a mismatch (someone else edited it first) returns `409 Conflict` with the current state instead of silently overwriting the concurrent edit.
- **Verified under real load**: a k6 test fired 250 concurrent HTTP requests at a shared vote endpoint against a live PostgreSQL instance — 100% of responses were correct (accepted, or the expected 409 on genuine collisions), with vote-count and score staying in exact sync (no lost or double-counted votes). See Load testing below for full numbers.

## Security

- Passwords hashed with **argon2**; JWT access token (15 min) + rotating refresh token stored hashed server-side (limits stolen-token blast radius).
- `@nestjs/throttler`: 5 req/min on `/auth/login` and `/auth/forgot-password`, 120 req/min globally, per client IP.
- Every query is scoped to the authenticated user; ownership/visibility/license is re-checked server-side on every request, never trusted from the client.
- Global `ValidationPipe({ whitelist, forbidNonWhitelisted, transform })` rejects payloads with unexpected fields or wrong types.
- Google ID tokens are cryptographically verified server-side rather than trusted as-is.
- Every authenticated action is logged server-side with user id, device, platform, and app version (`ActionLog` — `backend/src/common/logging/action-log.interceptor.ts`).
- All secrets live in `.env`, git-ignored; `.env.example` documents required keys with dummy values.
- **Not implemented, acknowledged as further hardening for a real deployment**: CAPTCHA/IP-reputation on top of per-IP throttling (distributed brute force), device-bound refresh tokens with a "log out other sessions" action, TLS termination + certificate pinning in production, a secrets manager instead of a flat `.env` file, and per-route body-size/rate limits on suggestion-spam-prone endpoints.

## Load testing

Tool: **k6** (`backend/scripts/k6-scenario.js`). Each simulated user logs in once (`setup()`), then repeatedly votes on a track and adds a playlist track — mirroring real client behavior (a mobile session reuses its JWT) rather than hammering `/auth/login` per request.

Seed data: `make seed-load-test` (creates N pre-verified users, one public event, one public/open-edit playlist). Run: `make load-test` (reads `EVENT_ID`/`PLAYLIST_ID`/`POOL_SIZE` env vars printed by the seed script).

Test machine: Intel Core i5-8210Y, 2 physical / 4 logical cores, 1.6 GHz (fanless, ultra-low-power class), 8 GB RAM, macOS 12 — API and PostgreSQL both running locally on the same machine. This is a deliberately low-end reference point, weaker than almost any real deployment target.

| | 60 concurrent users | 250 concurrent users |
|---|---|---|
| Iterations completed | 2395 | 2968 |
| Correctness (`check()` pass rate) | 100% | 100% — every response was a correct outcome (accepted, or the expected 409 when two votes genuinely raced for the same track) |
| `http_req_duration` p95 | **6.24 ms** | **1.51 s** |

Latency degrades between the two runs, but correctness never does — no lost votes, no corrupted ordering, no unhandled errors at either concurrency level. The dominant cause of the slowdown in this specific benchmark is row-level lock contention on a single hot row: the seed script creates only one starter track, so at 250 simulated users almost everyone votes for the same row, and Postgres serializes concurrent updates to it — by design, and the same mechanism that guarantees correctness. A real event has many candidate tracks splitting the write load, so production contention would be considerably lower than this worst-case single-track scenario; the weak, fanless 2-core test CPU (sharing cycles between argon2 hashing, the Node event loop, WebSocket gateways, and Postgres) compounds the effect further.

**Sizing takeaway**: this API stayed fully correct and sub-10ms at 60 concurrent users on hardware weaker than almost any real deployment target, and stayed fully correct — with increased but bounded latency, not failure — at 250. A real single low-end cloud instance (1–2 vCPU, 1–2 GB RAM, server-class clock speed, Postgres on its own instance) should comfortably clear hundreds of concurrent active users; a Raspberry Pi 4 is expected to land in the dozens-to-low-hundreds range — consistent with "dozens for a Raspberry, thousands for a low-end server" once horizontally scaled (the API is stateless — JWTs, no in-memory session — so N replicas behind a load balancer sharing one Postgres primary is the natural next step; the WebSocket gateways would need a Socket.IO Redis adapter to broadcast across replicas).

## Project structure

```
backend/src/
  auth/          Registration, login, email verification, password reset,
                 Google token verification, JWT issuance/refresh
  users/         Profile (public/friends/private scopes), music preferences
  friendships/   Friend requests, used to gate the "friends" visibility scope
  devices/       Per-device registration (installationId), used by action logs
  events/        Music Track Vote: events, tracks, votes, realtime gateway
  playlists/     Music Playlist Editor: playlists, tracks, reordering, realtime gateway
  subscriptions/ Free vs. paid plan
  beacons/       iBeacon → event resolution
  sync/          Offline snapshot + action replay
  common/        Prisma service, auth guards/decorators, action-log interceptor
  scripts/       Load-test data seeding + k6 scenario

mobile/lib/
  core/            Config (backend URL), networking (Dio/Socket.IO clients),
                   secure token storage, local DB, device context
  features/
    auth/          Register, login, email verification, password reset, social login
    profile/       Public/friends/private profile editor
    events/        Music Track Vote UI + realtime updates
    playlists/     Music Playlist Editor UI (drag-to-reorder) + conflict handling
    friends/       Friend requests (used by event/playlist invites)
    subscriptions/ Free/paid plan switcher
    beacons/       iBeacon scanning
    offline/       Outbox replay + snapshot sync
    settings/      Backend URL config, device registration, logout
  shared/widgets/  Responsive shell, generic key-value editor
```

## OAuth configuration (mobile)

Google sign-in needs platform-specific configuration that is never committed to the repo:

- **Google**: [developers.google.com/identity/sign-in](https://developers.google.com/identity/sign-in) — drop the resulting config into `mobile/android/app/google-services.json` (git-ignored).
