/*
  Warnings:

  - You are about to drop the `ControlDelegation` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ControlDelegation" DROP CONSTRAINT "ControlDelegation_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "ControlDelegation" DROP CONSTRAINT "ControlDelegation_deviceId_fkey";

-- DropForeignKey
ALTER TABLE "ControlDelegation" DROP CONSTRAINT "ControlDelegation_delegateId_fkey";

-- DropTable
DROP TABLE "ControlDelegation";
