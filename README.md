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
| Backend framework | **NestJS** (Node.js/TypeScript) | Decorator-based modules, guards and middleware map directly onto cross-cutting needs: `@nestjs/swagger` self-documents the API, guards enforce per-user data isolation, a middleware logs every request, `@nestjs/throttler` rate-limits auth routes, `@nestjs/websockets` gives realtime rooms for the two collaborative services. |
| Database | **PostgreSQL** via Prisma ORM | The two "competition" services (Track Vote, Playlist Editor) need real ACID transactions and DB-level unique constraints to correctly resolve concurrent writes — safer than pushing that correctness burden into application code. |
| API style | **REST + JSON** | Maps cleanly onto resources (users, events, tracks, votes, playlists); no schema compiler needed, first-class support in both NestJS and Flutter. Complemented by a thin WebSocket channel (Socket.IO) for realtime notifications — REST stays the only place a write is durably committed. |
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
make mobile-install    # installs the Flutter SDK in FLUTTER_DIR (default ~/goinfre/flutter) if missing, then flutter pub get
make mobile-web         # runs in Chrome — see "Running on an Android emulator" below for Android
```

`make mobile-install` also generates `local_db_native.g.dart` (Drift code generator); generated code is not committed.

The backend address is configurable before logging in (**Server: …** at the bottom of the login screen) and later in **Settings → Backend URL**. Confirm/set it to your backend's address (defaults to `http://localhost:3000`; the subject requires this to be configurable rather than hardcoded).

**Running on an Android emulator from the command line** (equivalent to pressing ▶️ Run in Android Studio):

```bash
make mobile-emulator                         # clears stale locks, boots the AVD (default Pixel_6;
                                              # override AVD_NAME=<name>, ANDROID_SDK=<sdk dir>,
                                              # AVD_HOME=<avd dir> if yours differ)

flutter devices                              # confirm it shows up as "emulator-5554" (or similar)
make mobile-android                          # builds, installs, and launches the app on it
                                              # (targets "emulator-5554" — if flutter devices showed a
                                              # different id, run `cd mobile && flutter run -d <that id>` instead)
```

The emulator keeps the app installed across reboots, so after the first `flutter run` you can also just tap the app icon on the virtual phone's home screen — that skips the rebuild but won't pick up new code changes (run `flutter run` again for that).

If the emulator reports "the emulator process has terminated" or refuses to start a second time, it's almost always a leftover lock file from an unclean shutdown — the `rm -f ... *.lock` line above fixes it; run it again before the next launch.

If the emulator itself crashes as soon as the app draws its first frame (seen with software GPU emulation on machines without a usable host GPU), run the app with Flutter's software renderer: `cd mobile && flutter run -d emulator-5554 --enable-software-rendering --no-enable-impeller`. This only affects the emulator, not real phones.

**Testing in a browser** (`flutter run -d chrome`): the backend's CORS only allows the origins listed in `backend/.env`'s `CORS_ORIGINS` (`http://localhost:8080` by default), but Flutter picks a random port each run unless you pin one. Run `flutter run -d chrome --web-port=8080` (or add whatever port you use to `CORS_ORIGINS`) — otherwise requests fail with a CORS/XMLHttpRequest error in the browser console.

**Registration emails**: with `SMTP_HOST` set in `backend/.env` (see `.env.example`, e.g. a Gmail app password), verification and password-reset emails are really sent (nodemailer). The verification email contains both the code and a clickable link (`GET /auth/verify-email?token=…`). With `SMTP_HOST` empty (dev mode), nothing is sent and the mail is printed to the backend terminal instead, e.g.:
```
[MailService] [DEV MAIL] to=you@example.com subject="Verify your Music Room account"
...code: 52b6ba443c5875e6c38d91d7ec2071fa2c508d84c03ef2c1
```
Copy that code into the app's verification screen. Dev mode exists so the project can be evaluated without any SMTP account.

All Makefile targets: `make help`.

### Troubleshooting

- **`flutter` fails with "Current Mac OS X version ... is lower than minimum supported version"**: the latest Flutter stable requires macOS 14+. On macOS 12/13, install Flutter 3.24.5 instead — download `flutter_macos_3.24.5-stable.zip` (or `flutter_macos_arm64_3.24.5-stable.zip` on Apple Silicon) from `storage.googleapis.com/flutter_infra_release/releases/stable/macos/`, unzip it (e.g. to `~/flutter`), and add `~/flutter/bin` to your `PATH`.
- **No Docker installed**: skip `make db-up` and point `backend/.env`'s `DATABASE_URL` at any local Postgres (see step 1 above).
- Google sign-in needs real OAuth credentials (see OAuth configuration below) — everything else, including registration/login by email+password, works without them.

## Mandatory part

- **User**: email/password with mandatory email verification and password reset, Google sign-in, linking a Google account to an existing account (Settings → Linked accounts), public/friends/private profile scopes (a friend's profile shows their public + friends-only info, never the private one), music preferences.
- **Services**: 2 of the 3 (the subject requires "at least 2 out of 3") — Music Track Vote and Music Playlist Editor — each with visibility (public/private) and license management. Track Vote licenses: everyone / invited users only / people at the venue during a time window (the owner sets the venue from their GPS position, a radius and a start/end time; voters' devices send their GPS position with the vote and the backend checks distance and time). Music Control Delegation was left out: it's the only one of the three with no bonus depending on it (IoT hooks into events, subscriptions gate playlists, offline sync replays event/playlist actions only), so dropping it keeps the mandatory requirement met while cutting scope.
- **Server / API**: PostgreSQL as the single source of truth; REST + JSON, self-documented via Swagger at `/docs`: every route lists its method, input (body/params) and output schema (`@ApiProperty` request and response DTOs in each module's `dto/` folder).
- **Mobile application**: Flutter app, backend URL configurable from Settings, Google auth.
- **Securing**: see below.
- **Ramp-up**: see Load testing below.
- **Agility**: `make backend-lint` / `make backend-build` / `flutter analyze` keep the codebase in a checked state; `.env` is git-ignored. Unit tests per layer (V.8), all run by `make test`: backend Jest (vote licensing incl. distance/time window, duplicate-vote conflict, playback control, Free plan playlist limit, playlist lock + version conflict on reorder, invite of unknown user, friendship payload privacy, login/email-verification) and mobile `flutter test` (register form validation, API error messages, model parsing).

## Bonus part

- **Multi-platform support**: the same Flutter codebase also runs on the web (`make mobile-web`), with a responsive layout (bottom nav on phones, side rail on wide screens).
- **Reflection on the IoT**: an event owner attaches an iBeacon (UUID/major/minor) to their event from the event screen (Android); the "Nearby events" screen scans for beacons and resolves them via `POST /beacons/scan` (public events only) to the event name, who can vote and the next tracks in its queue (the kind of music); tapping it opens the event (`backend/src/beacons`, `mobile/lib/features/beacons`).
- **Free vs. Paid subscription**: users switch between a Free and a Paid plan (Settings → Subscription). Free is limited: at most 3 playlists owned (Music Playlist Editor); Paid is unlimited. The limit is enforced by the backend (`backend/src/playlists/playlists.service.ts`, `FREE_PLAYLIST_LIMIT`), inside a transaction that locks the user row so two parallel creations cannot both pass it. The mandatory defaults (public, open-edit playlist) are the same on both plans.
- **Offline Mode**: right after login (and after every reconnection) the app stores a snapshot of the user's events and playlists (`GET /sync/snapshot`). Offline, lists and detail screens show that snapshot with an "Offline" banner, and votes, un-votes, track suggestions, playlist adds/removes/moves are queued in a local outbox. When the connection returns, `POST /sync/replay` replays them in order; each action's payload is validated with the same DTO rules as the matching API route, and the server re-checks every rule (licenses, location, versions), reports each action as applied / conflict / error, the app shows the result, then pulls a fresh snapshot and reloads open screens so no obsolete data stays displayed (`backend/src/sync`, `mobile/lib/features/offline`).

## Concurrency handling

The subject specifically flags "competition" problems (several users voting/reordering at once):

- **Votes**: `Vote` has a unique DB constraint on `(eventTrackId, userId)` — a duplicate vote from the same user hits a unique-violation, translated to `409 Conflict`. The score increment is a single atomic `UPDATE ... SET score = score + 1` inside the same transaction as the vote insert, so concurrent votes from many users never lose an update. Un-voting uses `DELETE ... WHERE eventTrackId, userId` and checks the deleted row count, so two concurrent un-votes cannot both decrement the score; "play next" marks the track played with a conditional update (`WHERE playedAt IS NULL`), so a double tap cannot skip two tracks.
- **Playlist editing**: every write (add, remove, move) starts by locking the playlist row (`SELECT ... FOR UPDATE`) inside its transaction, so writes to the same playlist are applied one after the other (other playlists are not blocked). On top of that, each `PlaylistTrack` carries a monotonic `version`: a move must supply the `version` it last read; if someone moved that track in the meantime the request gets `409 Conflict` with the current state instead of silently overwriting the concurrent edit — the app then reloads the list and tells the user.
- **Verified with concurrent requests**: 10 simultaneous moves of the same track at the same version → exactly 1 accepted, 9 × 409; 8 simultaneous adds → positions 0..7 with no duplicates; 3 simultaneous un-votes → 1 × 200, 2 × 404, score correct.
- **Verified under real load**: k6 with up to 1000 simultaneous users on the same event and the same playlist — 100% correct responses, vote count and score in exact sync, playlist positions without gaps or duplicates. See Load testing below for full numbers.

## Security

- Passwords hashed with **argon2**; JWT access token (15 min) + rotating refresh token stored hashed server-side (limits stolen-token blast radius).
- `@nestjs/throttler`: 5 req/min on `/auth/login`, `/auth/register`, `/auth/forgot-password` and `/auth/resend-verification`, 120 req/min globally, per client IP.
- Responses never expose another user's account data: friend lists only contain `id` + `displayName`, profiles are filtered by the viewer's relationship (public / friend / self).
- Refresh-token rotation revokes with a conditional update, so a replayed (stolen) refresh token can only be exchanged once.
- Every query is scoped to the authenticated user; ownership/visibility/license is re-checked server-side on every request, never trusted from the client.
- Global `ValidationPipe({ whitelist, forbidNonWhitelisted, transform })` rejects payloads with unexpected fields or wrong types.
- Google ID tokens are cryptographically verified server-side (signature, audience, `email_verified`) rather than trusted as-is.
- Every API request is logged server-side with user id (when known), device, platform, app version, route and HTTP status (`ActionLog` — `backend/src/common/logging/action-log.middleware.ts`). It is a middleware rather than an interceptor so that requests rejected before reaching a controller (wrong password, expired token, rate limit) are logged too — failed logins keep the targeted email to make brute force visible.
- All secrets live in `.env`, git-ignored; `.env.example` documents required keys with dummy values.
- **Not implemented, acknowledged as further hardening for a real deployment**: CAPTCHA/IP-reputation on top of per-IP throttling (distributed brute force), device-bound refresh tokens with a "log out other sessions" action, TLS termination + certificate pinning in production, a secrets manager instead of a flat `.env` file, and per-route body-size/rate limits on suggestion-spam-prone endpoints.

## Load testing

Tool: **k6** (`backend/scripts/k6-scenario.js`, run through the official `grafana/k6` Docker image so nothing has to be installed). Each simulated user logs in once (`setup()`), then loops: read the event, vote for one of its tracks, add a track to a shared playlist, wait 1 s — mirroring real client behavior (a mobile session reuses its JWT) rather than hammering `/auth/login`. A `check()` validates every response: an accepted write, or the expected `409` when the user already voted for that track.

It is a deliberate **worst case for contention**: every user votes on the same event and writes to the *same* playlist, whose writes are serialized by the playlist row lock (see Concurrency handling).

```bash
make seed-load-test POOL_SIZE=250    # creates N verified users + 1 public event + 1 public open-edit playlist,
                                      # prints EVENT_ID / PLAYLIST_ID
# All simulated users share one IP, so run the API with the per-IP rate limits raised,
# otherwise the test only measures the throttler (429s):
cd backend && npm run build && THROTTLE_GLOBAL_LIMIT=100000000 THROTTLE_AUTH_LIMIT=100000000 npm run start:prod
make load-test EVENT_ID=<id> PLAYLIST_ID=<id> POOL_SIZE=250
```

**Test machine**: Intel Core i7-13700 (16 cores / 24 threads), 15 GB RAM, Fedora 44 — on premise, a regular 42 workstation. API: one Node.js 22 process (production build, `npm run start:prod`, ~410 MB RSS under load); PostgreSQL 16 in a container on the same machine; each request also writes its `ActionLog` row.

| Concurrent users | 60 | 250 | 500 | 1000 |
|---|---|---|---|---|
| Requests/s | 87 | 270 | 335 | 359 |
| `http_req_duration` p95 | **5.3 ms** | **6.7 ms** | **385 ms** | **1.04 s** |
| Failed requests | 0 % | 0 % | 0 % | 0 % |
| Correct responses (`check()`) | 100 % | 100 % | 100 % | 100 % |

Data integrity after each run (checked in the database): the shared playlist had exactly one track per position (e.g. 14 432 tracks → 14 432 distinct positions 0…14 431 at 1000 users), and the event track's `score` equaled its number of `Vote` rows (1000 = 1000).

**Reading the numbers**: up to ~250 simultaneous users the API answers in a few milliseconds. Around 350 req/s the single Node.js process (one CPU core runs the event loop) saturates: beyond that point requests queue, so latency grows (385 ms at 500 users, ~1 s at 1000) — but nothing fails and no vote or position is ever lost. The limit is the process, not the database: the machine still has idle cores.

**Sizing takeaway**: one API process on this machine comfortably serves **~500 simultaneous active users** (p95 under 400 ms, each user making ~3 requests per second in this scenario — far more than a real user tapping a phone), with correctness preserved at 1000. A Raspberry Pi 4 (4 slower ARM cores, 4 GB RAM) would land in the dozens to low hundreds, consistent with the subject's "dozens for a Raspberry". To go further, the API is stateless (JWT, no in-memory session): run one process per core (Node cluster / several replicas behind a load balancer) against the same PostgreSQL, and add the Socket.IO Redis adapter so realtime broadcasts reach clients connected to any replica.

## Project structure

```
backend/src/
  auth/          Registration, login, email verification, password reset,
                 Google token verification, JWT issuance/refresh
  users/         Profile (public/friends/private scopes), music preferences
  friendships/   Friend requests, used to gate the "friends" visibility scope
  events/        Music Track Vote: events, tracks, votes, realtime gateway
  playlists/     Music Playlist Editor: playlists, tracks, reordering, realtime gateway
  subscriptions/ Free vs. paid plan
  beacons/       iBeacon → event resolution
  sync/          Offline snapshot + action replay
  common/        Prisma service, auth guards/decorators, action-log middleware
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
    settings/      Backend URL config, linked accounts, logout
  shared/widgets/  Responsive shell, generic key-value editor
```

## OAuth configuration (mobile)

Google sign-in needs platform-specific configuration that is never committed to the repo:

- **Google**: [developers.google.com/identity/sign-in](https://developers.google.com/identity/sign-in). The client ID used by the app is a *Web* OAuth client (`GOOGLE_CLIENT_ID` in `backend/.env`, `serverClientId` in `auth_controller.dart`, meta tag in `mobile/web/index.html`) — a public identifier, not a secret. In the Google Cloud console:
  - Web client → *Authorized JavaScript origins*: add `http://localhost:8080` (the port `make mobile-web` uses), otherwise the web button fails with "origin is not allowed for the given client ID".
  - Android client → package name `com.musicroom.musicroom_mobile` + the SHA-1 of the signing key (`cd mobile/android && ./gradlew signingReport`, debug key for development).
