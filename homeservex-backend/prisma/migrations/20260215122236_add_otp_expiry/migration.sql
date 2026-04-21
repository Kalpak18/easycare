/*
  Warnings:

  - The values [ID_PROOF,ADDRESS_PROOF,BANK_DETAILS] on the enum `ProviderDocumentType` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `expiresAt` to the `Otp` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "OnboardingStep" AS ENUM ('PHONE_VERIFIED', 'PROFILE_COMPLETED', 'KYC_PENDING', 'KYC_SUBMITTED', 'KYC_APPROVED', 'KYC_REJECTED');

-- AlterEnum
BEGIN;
CREATE TYPE "ProviderDocumentType_new" AS ENUM ('PROFILE_PHOTO', 'AADHAAR_FRONT', 'AADHAAR_BACK', 'PAN_CARD', 'BANK_PROOF', 'SKILL_CERTIFICATE', 'POLICE_VERIFICATION', 'DRIVING_LICENSE', 'VEHICLE_RC', 'VEHICLE_INSURANCE');
ALTER TABLE "ProviderDocument" ALTER COLUMN "type" TYPE "ProviderDocumentType_new" USING ("type"::text::"ProviderDocumentType_new");
ALTER TYPE "ProviderDocumentType" RENAME TO "ProviderDocumentType_old";
ALTER TYPE "ProviderDocumentType_new" RENAME TO "ProviderDocumentType";
DROP TYPE "public"."ProviderDocumentType_old";
COMMIT;

-- AlterTable
ALTER TABLE "Otp" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "ServiceProvider" ADD COLUMN     "onboardingStep" "OnboardingStep" NOT NULL DEFAULT 'PHONE_VERIFIED';
