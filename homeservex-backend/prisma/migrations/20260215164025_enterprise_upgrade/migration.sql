-- AlterTable
ALTER TABLE "ServiceProvider" ADD COLUMN     "accountHolderName" TEXT,
ADD COLUMN     "accountNumber" TEXT,
ADD COLUMN     "address" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "experienceYears" INTEGER,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "gstNumber" TEXT,
ADD COLUMN     "ifscCode" TEXT,
ADD COLUMN     "pincode" TEXT,
ADD COLUMN     "serviceRadiusKm" INTEGER DEFAULT 5,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "upiId" TEXT;

-- CreateTable
CREATE TABLE "ProviderOnboardingProgress" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "currentStep" TEXT NOT NULL,
    "completedSteps" TEXT[],

    CONSTRAINT "ProviderOnboardingProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KycRequirement" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT,
    "documentType" "ProviderDocumentType" NOT NULL,
    "isMandatory" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "KycRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderRiskProfile" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT,

    CONSTRAINT "ProviderRiskProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderPayout" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderPayout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProviderOnboardingProgress_providerId_key" ON "ProviderOnboardingProgress"("providerId");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderRiskProfile_providerId_key" ON "ProviderRiskProfile"("providerId");

-- AddForeignKey
ALTER TABLE "ProviderOnboardingProgress" ADD CONSTRAINT "ProviderOnboardingProgress_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ServiceProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KycRequirement" ADD CONSTRAINT "KycRequirement_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ServiceCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderRiskProfile" ADD CONSTRAINT "ProviderRiskProfile_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ServiceProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderPayout" ADD CONSTRAINT "ProviderPayout_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ServiceProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
