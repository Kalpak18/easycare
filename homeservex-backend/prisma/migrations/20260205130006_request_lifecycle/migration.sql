-- AlterEnum
ALTER TYPE "RequestStatus" ADD VALUE 'EXPIRED';

-- AlterTable
ALTER TABLE "ServiceRequest" ADD COLUMN     "assignedAt" TIMESTAMP(3),
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "startedAt" TIMESTAMP(3);
