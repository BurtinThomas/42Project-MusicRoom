AVD_NAME ?= Pixel_6

.PHONY: help install backend-install mobile-install \
        db-up db-down db-reset prisma-generate prisma-migrate \
        backend-dev backend-build backend-lint \
        mobile-emulator mobile-web mobile-android \
        load-test seed-load-test env

help:
	@echo "Music Room — available targets:"
	@echo "  make install          Install backend + mobile dependencies"
	@echo "  make env              Create backend/.env from .env.example if missing"
	@echo "  make db-up            Start local PostgreSQL (docker compose)"
	@echo "  make db-down          Stop local PostgreSQL"
	@echo "  make prisma-migrate   Run Prisma migrations against DATABASE_URL"
	@echo "  make backend-dev      Run the NestJS API in watch mode"
	@echo "  make backend-build    Build the backend for production"
	@echo "  make backend-lint     Lint the backend"
	@echo "  make mobile-emulator  Boot the Android emulator (AVD_NAME, default Pixel_6)"
	@echo "  make mobile-web       Run the Flutter app in Chrome on a fixed port (matches CORS_ORIGINS)"
	@echo "  make mobile-android   Run the Flutter app on the running Android emulator"
	@echo "  make seed-load-test   Seed accounts/event/playlist for a k6 run"
	@echo "  make load-test        Run the k6 load-testing scenario"

install: backend-install mobile-install

backend-install:
	cd backend && npm install

mobile-install:
	cd mobile && flutter pub get

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

mobile-emulator:
	rm -f ~/.android/avd/$(AVD_NAME).avd/*.lock
	cd ~/Android/Sdk/emulator && ./emulator -avd $(AVD_NAME) &

mobile-web:
	cd mobile && flutter run -d chrome --web-port=8080

mobile-android:
	cd mobile && flutter run -d emulator-5554

seed-load-test:
	cd backend && npx ts-node scripts/seed-load-test.ts

load-test:
	cd backend && npx k6 run scripts/k6-scenario.js
