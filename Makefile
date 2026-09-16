.PHONY: help install backend-install mobile-install \
        db-up db-down db-reset prisma-generate prisma-migrate \
        backend-dev backend-build backend-lint \
        mobile-run mobile-build-web \
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
	@echo "  make mobile-run       Run the Flutter app (flutter run)"
	@echo "  make mobile-build-web Build the Flutter web release bundle"
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

mobile-run:
	cd mobile && flutter run

mobile-build-web:
	cd mobile && flutter build web

seed-load-test:
	cd backend && npx ts-node scripts/seed-load-test.ts

load-test:
	cd backend && npx k6 run scripts/k6-scenario.js
