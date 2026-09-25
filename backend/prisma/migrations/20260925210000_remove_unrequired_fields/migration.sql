-- AlterEnum: LOCAL was never stored (local accounts have no SocialIdentity)
BEGIN;
CREATE TYPE "AuthProvider_new" AS ENUM ('GOOGLE');
ALTER TABLE "SocialIdentity" ALTER COLUMN "provider" TYPE "AuthProvider_new" USING ("provider"::text::"AuthProvider_new");
ALTER TYPE "AuthProvider" RENAME TO "AuthProvider_old";
ALTER TYPE "AuthProvider_new" RENAME TO "AuthProvider";
DROP TYPE "AuthProvider_old";
COMMIT;

-- ActionLog: the device model becomes a column (it was in metadata), the
-- Device table is removed.
ALTER TABLE "ActionLog" DROP CONSTRAINT "ActionLog_deviceId_fkey";
ALTER TABLE "ActionLog" ADD COLUMN "device" TEXT;
UPDATE "ActionLog" SET "device" = COALESCE("metadata"->>'deviceModel', 'unknown');
ALTER TABLE "ActionLog" ALTER COLUMN "device" SET NOT NULL;
ALTER TABLE "ActionLog" DROP COLUMN "deviceId";

ALTER TABLE "Device" DROP CONSTRAINT "Device_userId_fkey";
DROP TABLE "Device";

-- Playlist: the paid plan now limits the number of playlists instead
ALTER TABLE "Playlist" DROP COLUMN "requiresPaidPlan";

-- Track: provider fields that were never used
ALTER TABLE "Track" DROP COLUMN "durationMs",
DROP COLUMN "externalRef";
