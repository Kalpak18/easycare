-- CreateEnum
CREATE TYPE "ProviderSource" AS ENUM ('MARKETPLACE', 'COMPANY');

-- CreateEnum
CREATE TYPE "ProviderTier" AS ENUM ('BRONZE', 'SILVER', 'GOLD');

-- AlterTable
ALTER TABLE "ServiceProvider" ADD COLUMN     "source" "ProviderSource" NOT NULL DEFAULT 'MARKETPLACE',
ADD COLUMN     "tier" "ProviderTier" NOT NULL DEFAULT 'BRONZE';
