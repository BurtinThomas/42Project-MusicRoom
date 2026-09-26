# Music Room

Music, Collaboration and mobility: a NestJS + PostgreSQL backend and a Flutter app (Android + web).

This README follows the subject section by section. For each requirement: what we did, and where it is in the code.

## Run

```bash
make install          # npm install + Flutter SDK (if missing) + flutter pub get
make env              # backend/.env from backend/.env.example, then fill in the secrets
make db-up            # PostgreSQL (docker compose)
make prisma-migrate   # create the tables
make backend-dev      # API on http://localhost:3000, Swagger on /docs
make mobile-web       # app in Chrome (or: make mobile-emulator, then make mobile-android)
make test             # unit tests (backend + mobile)
make load-test        # k6 load test (see V.7)
```

`make help` lists every target. Without `SMTP_HOST` in `backend/.env`, verification and reset emails are printed in the backend terminal instead of being sent. For Google sign-in, the Google Cloud Web client needs `http://localhost:8080` as an authorized JavaScript origin, and the Android client needs the package `com.musicroom.musicroom_mobile` + the SHA-1 of the signing key.

## IV.1 Software architecture

| Subject | What we did | Code |
|---|---|---|
| Choose and justify the backend technology | **NestJS** (TypeScript): modules, guards, middleware and Swagger cover auth, logging and API docs out of the box. **PostgreSQL** via Prisma: real transactions, row locks and unique constraints, so concurrent votes and edits are resolved by the database. | [app.module.ts](backend/src/app.module.ts), [schema.prisma](backend/prisma/schema.prisma) |
| No third-party library committed, dependencies downloaded from a clone with a Makefile | `make install` runs `npm install` and `flutter pub get` (and installs Flutter if missing). `node_modules`, builds and generated code are git-ignored. | [Makefile](Makefile#L38-L55), [.gitignore](.gitignore#L8-L30) |

## IV.2 Mobile experience

| Subject | What we did | Code |
|---|---|---|
| Every action available in the app, on Android or iOS | Flutter app on Android (and web, see bonus). Tabs: events, playlists, friends, settings (profile, subscription, backend URL, linked accounts). | [app_router.dart](mobile/lib/app_router.dart#L58-L133) |

## V.1 User

| Subject | What we did | Code |
|---|---|---|
| Account required on first launch | Not logged in → every screen redirects to login / register. | [app_router.dart](mobile/lib/app_router.dart#L29-L41) |
| Sign up with email + password | Password hashed with argon2, account created unverified, verification email sent. | [auth.service.ts](backend/src/auth/auth.service.ts#L35-L50), [register_screen.dart](mobile/lib/features/auth/presentation/register_screen.dart) |
| Sign up / log in with Google | The Google ID token is verified by the backend (signature, audience, `email_verified`), then the account is found or created. | [auth.service.ts](backend/src/auth/auth.service.ts#L103-L134), [users.service.ts](backend/src/users/users.service.ts#L49-L77), [auth_controller.dart](mobile/lib/features/auth/application/auth_controller.dart#L83-L97) |
| Link Google to an existing account | Settings → Linked accounts → Link. Refused if that Google account already belongs to another user. | [auth.service.ts](backend/src/auth/auth.service.ts#L116-L124), [users.service.ts](backend/src/users/users.service.ts#L79-L97), [settings_screen.dart](mobile/lib/features/settings/presentation/settings_screen.dart#L99-L116) |
| Public info, friends-only info, private info, music preferences | Four fields on `User`, edited as key/value lists in *My profile*. | [schema.prisma](backend/prisma/schema.prisma#L56-L59), [users.service.ts](backend/src/users/users.service.ts#L156-L168), [profile_screen.dart](mobile/lib/features/profile/presentation/profile_screen.dart#L48-L70) |
| Who sees what | Profile filtered by the viewer: anyone → public + music preferences; accepted friend → + friends-only; yourself → everything. Private info never reaches anyone else. | [users.service.ts](backend/src/users/users.service.ts#L170-L204), [friend_profile_screen.dart](mobile/lib/features/friends/presentation/friend_profile_screen.dart#L32-L38) |
| Friends (needed for friends-only info) | Friend request by user id, accept or refuse. | [friendships.service.ts](backend/src/friendships/friendships.service.ts), [friends_screen.dart](mobile/lib/features/friends/presentation/friends_screen.dart) |
| Email validation | Login refused (`EMAIL_NOT_VERIFIED`) until the code from the email is entered or the link clicked. The app then opens the verify screen; the email can be re-sent. | [auth.service.ts](backend/src/auth/auth.service.ts#L60-L62), [users.service.ts](backend/src/users/users.service.ts#L103-L113), [mail.service.ts](backend/src/mail/mail.service.ts#L36-L47), [verify_email_screen.dart](mobile/lib/features/auth/presentation/verify_email_screen.dart) |
| Forgot password | Reset code sent by email, valid 1 hour, usable once. | [auth.service.ts](backend/src/auth/auth.service.ts#L87-L101), [users.service.ts](backend/src/users/users.service.ts#L124-L154), [forgot_password_screen.dart](mobile/lib/features/auth/presentation/forgot_password_screen.dart), [reset_password_screen.dart](mobile/lib/features/auth/presentation/reset_password_screen.dart) |
| Emails without an SMTP account | With `SMTP_HOST` empty, the email is printed in the backend terminal. | [mail.service.ts](backend/src/mail/mail.service.ts#L27-L34) |

## V.2 Services

2 of the 3 services: **Music Track Vote** and **Music Playlist Editor**. Music Control Delegation was not done: it is the only one that no bonus depends on (IoT uses events, subscriptions limit playlists, offline mode replays event and playlist actions).

### V.2.1 Music Track Vote

| Subject | What we did | Code |
|---|---|---|
| Anyone can suggest a track | Any user who can see the event adds a track (title + artist) to the queue. | [events.service.ts](backend/src/events/events.service.ts#L142-L158), [event_detail_screen.dart](mobile/lib/features/events/presentation/event_detail_screen.dart#L203-L240) |
| Vote for a track | One vote per user per track; a user can remove their vote. | [events.service.ts](backend/src/events/events.service.ts#L160-L221), [event_detail_screen.dart](mobile/lib/features/events/presentation/event_detail_screen.dart#L95-L103) |
| Many votes → goes up, played earlier | Queue sorted by score, then by suggestion time. *Play next* (owner) plays the top track. | [events.service.ts](backend/src/events/events.service.ts#L103-L110), [events.service.ts](backend/src/events/events.service.ts#L223-L254) |
| Live | Every suggestion, vote and played track is pushed (Socket.IO) to everyone on the event screen; the app re-sorts the queue. | [events.gateway.ts](backend/src/events/events.gateway.ts#L30-L70), [events_providers.dart](mobile/lib/features/events/application/events_providers.dart#L83-L103) |
| Public by default | `visibility` defaults to `PUBLIC`. | [schema.prisma](backend/prisma/schema.prisma#L134), [events.service.ts](backend/src/events/events.service.ts#L31) |
| Public: everyone can find it and vote | Event list = public events + mine + those I'm invited to. | [events.service.ts](backend/src/events/events.service.ts#L68-L79) |
| Private: only invited users find it and vote | Checked on detail, suggestion, vote and when joining the live channel. The owner invites friends. | [events.service.ts](backend/src/events/events.service.ts#L89-L101), [events.service.ts](backend/src/events/events.service.ts#L126-L140), [events.gateway.ts](backend/src/events/events.gateway.ts#L37), [event_detail_screen.dart](mobile/lib/features/events/presentation/event_detail_screen.dart#L125-L150) |
| License: everyone votes by default | `voteLicense` defaults to `OPEN`. | [schema.prisma](backend/prisma/schema.prisma#L135), [events.service.ts](backend/src/events/events.service.ts#L265) |
| License: only invited users vote | `INVITE_ONLY`. | [events.service.ts](backend/src/events/events.service.ts#L267-L276) |
| License: people at a place during a time window | `LOCATION_TIME`: at creation the owner sets the place (their GPS position), a radius and a start/end time. Each vote sends the phone's GPS position; the backend checks the time window and the distance. | [events.service.ts](backend/src/events/events.service.ts#L46-L66), [events.service.ts](backend/src/events/events.service.ts#L278-L307), [geo.ts](backend/src/common/utils/geo.ts), [create_event_screen.dart](mobile/lib/features/events/presentation/create_event_screen.dart#L80-L150), [events_providers.dart](mobile/lib/features/events/application/events_providers.dart#L115-L121) |
| Concurrency (several people vote for different tracks or the same one) | Unique `(track, user)` in the database → a second vote gets `409`. Vote insert + `score + 1` in one transaction (atomic increment, no lost vote). Un-vote checks the deleted row count. *Play next* uses a conditional update, so a double tap can't skip two tracks. | [schema.prisma](backend/prisma/schema.prisma#L207), [events.service.ts](backend/src/events/events.service.ts#L177-L194), [events.service.ts](backend/src/events/events.service.ts#L206-L217), [events.service.ts](backend/src/events/events.service.ts#L234-L239) |

### V.2.3 Music Playlist Editor

| Subject | What we did | Code |
|---|---|---|
| Real-time multi-user edition | Every add, remove and move is pushed (Socket.IO) to everyone on the playlist screen. | [playlists.gateway.ts](backend/src/playlists/playlists.gateway.ts#L30-L69), [playlists_providers.dart](mobile/lib/features/playlists/application/playlists_providers.dart#L83-L100) |
| Public by default | `visibility` defaults to `PUBLIC`. | [schema.prisma](backend/prisma/schema.prisma#L215), [playlists.service.ts](backend/src/playlists/playlists.service.ts#L46) |
| Public: every user has access. Private: only invited users | Playlist list = public + mine + invited; detail refused otherwise. The owner invites friends. | [playlists.service.ts](backend/src/playlists/playlists.service.ts#L53-L81), [playlists.service.ts](backend/src/playlists/playlists.service.ts#L106-L134), [playlist_detail_screen.dart](mobile/lib/features/playlists/presentation/playlist_detail_screen.dart#L114-L140) |
| License: everyone edits by default, only invited users with the license | `editLicense` defaults to `OPEN`; `INVITE_ONLY` checked on every add, remove and move. | [schema.prisma](backend/prisma/schema.prisma#L216), [playlists.service.ts](backend/src/playlists/playlists.service.ts#L90-L104) |
| Reorder tracks | Drag and drop in the app. | [playlist_detail_screen.dart](mobile/lib/features/playlists/presentation/playlist_detail_screen.dart#L72-L85) |
| Concurrency (several people move different tracks or the same one) | Every write locks the playlist row (`SELECT … FOR UPDATE`), so writes to the same playlist run one after another and positions never have gaps or duplicates. A move must send the track `version` it last read; if someone moved it in the meantime → `409` with the current state, and the app reloads and tells the user. | [playlists.service.ts](backend/src/playlists/playlists.service.ts#L83-L88), [playlists.service.ts](backend/src/playlists/playlists.service.ts#L183-L241), [schema.prisma](backend/prisma/schema.prisma#L244), [playlists_repository.dart](mobile/lib/features/playlists/data/playlists_repository.dart#L67-L89) |

## V.3 Server

| Subject | What we did | Code |
|---|---|---|
| All data stored on the backend, the backend is the truth | Everything is in PostgreSQL. Every rule (visibility, license, versions) is checked by the backend; the app only keeps a cache for offline mode. | [schema.prisma](backend/prisma/schema.prisma), [events.service.ts](backend/src/events/events.service.ts#L256-L308) |

## V.4 API

| Subject | What we did | Code |
|---|---|---|
| Documentation with methods, inputs, outputs | Swagger at `/docs`, generated from the code. Every route has a request DTO and a response DTO (each module's `dto/` folder). | [main.ts](backend/src/main.ts#L25-L35), [events.controller.ts](backend/src/events/events.controller.ts#L70-L82) |
| REST, justified | Our data are resources (events, tracks, votes, playlists) → URLs + HTTP verbs. Stateless (JWT), so several API processes can run side by side. Status codes carry meaning (`403` license, `409` conflict). Socket.IO is only used to push changes; writes always go through REST. | [events.controller.ts](backend/src/events/events.controller.ts) |
| JSON, justified | Native in TypeScript and Dart, human-readable, validated field by field by the DTOs. | [main.ts](backend/src/main.ts#L11-L17) |

## V.5 Mobile application

| Subject | What we did | Code |
|---|---|---|
| The app is only a "remote control" | Every read and write goes through the API; no business rule in the app. | [api_client.dart](mobile/lib/core/network/api_client.dart) |
| Backend address configurable | *Server: …* at the bottom of the login screen, and Settings → Backend URL. Saved on the device. | [app_config.dart](mobile/lib/core/config/app_config.dart#L23-L33), [backend_url_dialog.dart](mobile/lib/features/settings/presentation/backend_url_dialog.dart), [login_screen.dart](mobile/lib/features/auth/presentation/login_screen.dart#L172-L178) |
| Google authentication in the app | `google_sign_in`; the ID token is sent to the backend, which verifies it. | [auth_controller.dart](mobile/lib/features/auth/application/auth_controller.dart#L51-L110), [login_screen.dart](mobile/lib/features/auth/presentation/login_screen.dart#L160-L166) |

## V.6 Securing

| Subject | What we did | Code |
|---|---|---|
| A user accesses their data, not others' | JWT required on every route by default (`@Public()` for the few exceptions). The user id comes from the token, never from the request. Each service checks owner / invite / license. Friend lists only expose id + name. WebSocket connections are authenticated too. | [app.module.ts](backend/src/app.module.ts#L45), [jwt-auth.guard.ts](backend/src/auth/guards/jwt-auth.guard.ts#L12-L19), [authenticate-socket.ts](backend/src/common/ws/authenticate-socket.ts), [friendships.service.ts](backend/src/friendships/friendships.service.ts#L77-L83) |
| Brute force | Rate limit per IP: 5/min on register, login, Google login, forgot-password, resend-verification; 120/min on everything else. | [app.module.ts](backend/src/app.module.ts#L23-L32), [auth.controller.ts](backend/src/auth/auth.controller.ts#L33-L34) |
| Password storage | argon2. | [auth.service.ts](backend/src/auth/auth.service.ts#L36), [auth.service.ts](backend/src/auth/auth.service.ts#L57) |
| Session theft | Access token valid 15 min. Refresh token random, stored hashed, replaced at each use and usable only once. Logout revokes it. The app keeps tokens in secure storage. | [auth.service.ts](backend/src/auth/auth.service.ts#L136-L192), [token_storage.dart](mobile/lib/core/storage/token_storage.dart) |
| Malformed input | Global validation: unknown fields refused, types checked; password ≥ 8 characters. | [main.ts](backend/src/main.ts#L11-L17), [register.dto.ts](backend/src/auth/dto/register.dto.ts) |
| Account discovery | *Forgot password* and *resend verification* always answer the same message, whether the email exists or not. | [auth.service.ts](backend/src/auth/auth.service.ts#L66-L96) |
| Other hazards, identified and explained (not implemented) | Distributed brute force → CAPTCHA / IP reputation. Stolen phone → refresh tokens bound to a device + "log out other sessions". Network sniffing → HTTPS + certificate pinning in production. Leaked `.env` → secrets manager. Suggestion spam → per-route limits. | |
| Every action logged with platform, device, app version | The app adds `X-Client-Platform`, `X-Client-Device`, `X-Client-App-Version` to every request. A middleware writes one `ActionLog` row per request (user, route, status), rejected ones included (wrong password, rate limit); failed logins keep the email tried. | [api_client.dart](mobile/lib/core/network/api_client.dart#L12-L17), [device_context.dart](mobile/lib/core/device/device_context.dart#L20-L47), [action-log.middleware.ts](backend/src/common/logging/action-log.middleware.ts#L11-L50), [schema.prisma](backend/prisma/schema.prisma#L114-L120) |

## V.7 Ramp-up

`make load-test POOL_SIZE=250` does everything: starts PostgreSQL, builds the API, creates N verified users + 1 public event + 1 public playlist, starts the API with the per-IP limits lifted (all k6 users share one IP), runs **k6**, then stops the API. ([Makefile](Makefile#L102-L119), [seed-load-test.ts](backend/scripts/seed-load-test.ts), [k6-scenario.js](backend/scripts/k6-scenario.js))

Each simulated user logs in once, then loops: read the event, vote, add a track to the playlist, wait 1 s. Worst case on purpose: everyone writes to the **same** event and the **same** playlist.

**Machine**: Intel Core i7-13700 (16 cores / 24 threads), 15 GB RAM, Fedora 44, on premise (a 42 workstation). One Node.js 22 process (production build), PostgreSQL 16 in a container on the same machine.

| Simultaneous users | 60 | 250 | 500 | 1000 |
|---|---|---|---|---|
| Requests/s | 87 | 270 | 335 | 359 |
| Response time p95 | 5.3 ms | 6.7 ms | 385 ms | 1.04 s |
| Failed requests | 0 % | 0 % | 0 % | 0 % |
| Correct responses | 100 % | 100 % | 100 % | 100 % |

After each run the database was checked: one track per playlist position (no gap, no duplicate) and the track's score equal to its number of votes.

**Conclusion**: up to ~250 users the API answers in a few ms. Around 350 requests/s the single Node.js process saturates (one core runs the event loop): latency grows, but nothing fails and no vote or position is lost. One process serves **~500 simultaneous active users** here; a Raspberry Pi 4 would be in the dozens to low hundreds. To go further: one API process per core behind a load balancer (the API is stateless) + the Socket.IO Redis adapter.

## V.8 Agility, quality and continuous integration

| Subject | What we did | Code |
|---|---|---|
| One-off tests for each layer | Backend (Jest, 17 tests): login and email verification, vote licenses (invite, distance, time window), duplicate vote, play next, Free plan limit, playlist version conflict, invite of unknown user, friend list privacy, offline replay validation. Mobile (`flutter test`, 7 tests): register form, API error messages, model parsing. All run by `make test`. | [auth](backend/src/auth/auth.service.spec.ts), [events](backend/src/events/events.service.spec.ts), [playlists](backend/src/playlists/playlists.service.spec.ts), [friendships](backend/src/friendships/friendships.service.spec.ts), [sync](backend/src/sync/sync.service.spec.ts), [mobile/test](mobile/test), [Makefile](Makefile#L84-L86) |
| Code quality | `make backend-lint`, `make backend-build`, `flutter analyze`. | [Makefile](Makefile#L78-L82), [.eslintrc.js](backend/.eslintrc.js), [analysis_options.yaml](mobile/analysis_options.yaml) |
| Credentials in a git-ignored `.env` | `backend/.env` is git-ignored; `.env.example` lists the keys with dummy values; the API refuses to start without its JWT secret. | [.gitignore](.gitignore#L10), [.env.example](backend/.env.example), [configuration.ts](backend/src/config/configuration.ts#L1-L5) |

## VI Bonus

| Subject | What we did | Code |
|---|---|---|
| VI.1 Multi-platform, responsive web | The same Flutter code runs on the web (`make mobile-web`). Bottom bar on phones, side rail from 800 px wide. Local storage: SQLite on Android, localStorage on the web. | [home_shell.dart](mobile/lib/shared/widgets/home_shell.dart#L33-L76), [local_db.dart](mobile/lib/core/storage/local_db.dart) |
| VI.2 IoT (iBeacon) | The owner attaches an iBeacon (UUID / major / minor) to their event. *Nearby events* scans over Bluetooth and asks the backend which event it is → name, who can vote, next 3 tracks; tap to open the event. Public events only. | [beacons.service.ts](backend/src/beacons/beacons.service.ts), [event_detail_screen.dart](mobile/lib/features/events/presentation/event_detail_screen.dart#L154-L200), [beacon_service.dart](mobile/lib/features/beacons/data/beacon_service.dart#L26-L50), [nearby_events_screen.dart](mobile/lib/features/beacons/presentation/nearby_events_screen.dart) |
| VI.3 Free vs. Paid subscription | Switch in Settings → Subscription. Free: at most 3 playlists owned; Paid: unlimited. Checked by the backend with the user row locked, so two parallel creations can't both get through. | [subscriptions.service.ts](backend/src/subscriptions/subscriptions.service.ts#L23-L29), [playlists.service.ts](backend/src/playlists/playlists.service.ts#L20-L51), [subscription_screen.dart](mobile/lib/features/subscriptions/presentation/subscription_screen.dart) |
| VI.4 Offline mode | A snapshot of my events and playlists is saved after login and after each reconnection. Offline: screens show the snapshot with an "Offline" banner; votes, suggestions and playlist add / remove / move go into a local outbox. Back online: the outbox is replayed in order. | [sync.service.ts](backend/src/sync/sync.service.ts#L24-L80), [offline_providers.dart](mobile/lib/features/offline/application/offline_providers.dart#L27-L97), [sync_service.dart](mobile/lib/features/offline/data/sync_service.dart), [local_db.dart](mobile/lib/core/storage/local_db.dart) |
| VI.4 Conflicts and concurrency | The replay goes through the same service code as the live API (same locks, versions, licenses), with payloads validated by the same rules. Each action comes back *applied*, *conflict* or *error*, and the app shows the result. | [sync.service.ts](backend/src/sync/sync.service.ts#L46-L141) |
| VI.4 Obsolete data | After the replay, a fresh snapshot is pulled and the open screens reload. | [sync_service.dart](mobile/lib/features/offline/data/sync_service.dart#L59-L63), [events_providers.dart](mobile/lib/features/events/application/events_providers.dart#L36), [playlists_providers.dart](mobile/lib/features/playlists/application/playlists_providers.dart#L35) |
