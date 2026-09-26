ifneq ($(wildcard $(HOME)/goinfre/android-sdk/emulator),)
ANDROID_SDK ?= $(HOME)/goinfre/android-sdk
AVD_HOME    ?= $(HOME)/goinfre/avd
else
ANDROID_SDK ?= $(HOME)/Android/Sdk
AVD_HOME    ?= $(HOME)/.android/avd
endif
AVD_NAME    ?= $(or $(basename $(notdir $(firstword $(wildcard $(AVD_HOME)/*.ini)))),Pixel_6)
FLUTTER_DIR ?= $(HOME)/goinfre/flutter
FLUTTER     := $(FLUTTER_DIR)/bin/flutter
ifneq ($(wildcard $(HOME)/goinfre),)
export GRADLE_USER_HOME ?= $(HOME)/goinfre/gradle
endif

.PHONY: help install backend-install mobile-install \
        db-up db-down db-reset prisma-generate prisma-migrate \
        backend-dev backend-build backend-lint \
        mobile-emulator mobile-web mobile-android \
        load-test env flutter-sdk mobile-build-dir test

help:
	@echo "Music Room — available targets:"
	@echo "  make install          Install backend + mobile dependencies"
	@echo "  make flutter-sdk      Install the Flutter SDK in FLUTTER_DIR if missing"
	@echo "  make env              Create backend/.env from .env.example if missing"
	@echo "  make db-up            Start local PostgreSQL (docker compose)"
	@echo "  make db-down          Stop local PostgreSQL"
	@echo "  make prisma-migrate   Run Prisma migrations against DATABASE_URL"
	@echo "  make backend-dev      Run the NestJS API in watch mode"
	@echo "  make backend-build    Build the backend for production"
	@echo "  make backend-lint     Lint the backend"
	@echo "  make test             Run backend (Jest) and mobile (flutter test) unit tests"
	@echo "  make mobile-emulator  Boot the Android emulator (first AVD found; override AVD_NAME, ANDROID_SDK, AVD_HOME)"
	@echo "  make mobile-web       Run the Flutter app in Chrome on a fixed port (matches CORS_ORIGINS)"
	@echo "  make mobile-android   Run the Flutter app on the running Android emulator"
	@echo "  make load-test        Seed data, start the API, run the k6 load test, stop the API"

install: backend-install mobile-install

backend-install:
	cd backend && npm install

flutter-sdk: $(FLUTTER)

$(FLUTTER):
	git clone --depth 1 -b stable https://github.com/flutter/flutter.git $(FLUTTER_DIR)
	$(FLUTTER) --disable-analytics

mobile-build-dir:
	@[ ! -L mobile/build ] || mkdir -p "$$(readlink mobile/build)"

mobile-install: $(FLUTTER)
	cd mobile && $(FLUTTER) pub get
	cd mobile && $(FLUTTER_DIR)/bin/dart run build_runner build --delete-conflicting-outputs

env:
	[ -f backend/.env ] || cp backend/.env.example backend/.env

db-up:
	docker compose up -d postgres

db-down:
	docker compose down

db-reset: db-down
	docker compose down -v
	$(MAKE) db-up

prisma-generate:
	cd backend && npx prisma generate

prisma-migrate:
	cd backend && npx prisma migrate deploy

backend-dev: env
	cd backend && npm run start:dev

backend-build:
	cd backend && npm run build

backend-lint:
	cd backend && npm run lint

test: $(FLUTTER)
	cd backend && npm test
	cd mobile && $(FLUTTER) test

mobile-emulator:
	rm -f $(AVD_HOME)/$(AVD_NAME).avd/*.lock
	ANDROID_AVD_HOME=$(AVD_HOME) $(ANDROID_SDK)/emulator/emulator -avd $(AVD_NAME) &

mobile-web: $(FLUTTER) mobile-build-dir
	cd mobile && $(FLUTTER) run -d chrome --web-port=8080

mobile-android: $(FLUTTER) mobile-build-dir
	cd mobile && $(FLUTTER) run -d emulator-5554

POOL_SIZE ?= 250
BASE_URL  ?= http://localhost:3000
API_LOG   := backend/load-test-api.log

load-test: env db-up backend-build
	@! curl -s -o /dev/null $(BASE_URL) || { echo "$(BASE_URL) is already in use: stop the running API first"; exit 1; }
	@set -e; \
	ids=$$(cd backend && POOL_SIZE=$(POOL_SIZE) npx ts-node scripts/seed-load-test.ts); \
	echo "$$ids"; \
	event_id=$$(echo "$$ids" | sed -n 's/^EVENT_ID=//p'); \
	playlist_id=$$(echo "$$ids" | sed -n 's/^PLAYLIST_ID=//p'); \
	(cd backend && THROTTLE_GLOBAL_LIMIT=100000000 THROTTLE_AUTH_LIMIT=100000000 exec node dist/main) > $(API_LOG) 2>&1 & \
	api=$$!; \
	trap 'kill $$api 2>/dev/null' EXIT; \
	until curl -s -o /dev/null $(BASE_URL); do \
		kill -0 $$api 2>/dev/null || { echo "API failed to start:"; tail -20 $(API_LOG); exit 1; }; \
		sleep 1; \
	done; \
	echo "API up (logs: $(API_LOG)), starting k6..."; \
	docker run --rm --network host -v "$(CURDIR)/backend/scripts:/scripts:Z" docker.io/grafana/k6 run \
		-e BASE_URL=$(BASE_URL) -e EVENT_ID=$$event_id -e PLAYLIST_ID=$$playlist_id -e POOL_SIZE=$(POOL_SIZE) \
		/scripts/k6-scenario.js
