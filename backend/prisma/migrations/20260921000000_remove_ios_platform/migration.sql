/*
  Warnings:

  - The values [IOS] on the enum `ActionLogPlatform` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ActionLogPlatform_new" AS ENUM ('ANDROID', 'WEB', 'UNKNOWN');
ALTER TABLE "Device" ALTER COLUMN "platform" TYPE "ActionLogPlatform_new" USING ("platform"::text::"ActionLogPlatform_new");
ALTER TABLE "ActionLog" ALTER COLUMN "platform" TYPE "ActionLogPlatform_new" USING ("platform"::text::"ActionLogPlatform_new");
ALTER TYPE "ActionLogPlatform" RENAME TO "ActionLogPlatform_old";
ALTER TYPE "ActionLogPlatform_new" RENAME TO "ActionLogPlatform";
DROP TYPE "ActionLogPlatform_old";
COMMIT;
