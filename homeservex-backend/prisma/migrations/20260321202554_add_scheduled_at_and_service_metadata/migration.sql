-- AlterTable
ALTER TABLE "ServiceRequest" ADD COLUMN     "scheduledAt" TIMESTAMP(3),
ADD COLUMN     "serviceMetadata" JSONB;
