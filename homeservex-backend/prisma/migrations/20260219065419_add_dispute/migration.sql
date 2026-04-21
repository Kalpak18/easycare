-- CreateTable
CREATE TABLE "Dispute" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "raisedBy" "Role" NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "adminNote" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Dispute_requestId_key" ON "Dispute"("requestId");

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ServiceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
