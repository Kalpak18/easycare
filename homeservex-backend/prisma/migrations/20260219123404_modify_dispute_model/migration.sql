/*
  Warnings:

  - The `status` column on the `Dispute` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `providerId` to the `Dispute` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Dispute` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED_USER', 'RESOLVED_PROVIDER', 'REJECTED');

-- AlterTable
ALTER TABLE "Dispute" ADD COLUMN     "evidence" TEXT[],
ADD COLUMN     "providerId" TEXT NOT NULL,
ADD COLUMN     "resolutionNote" TEXT,
ADD COLUMN     "userId" TEXT NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN';
