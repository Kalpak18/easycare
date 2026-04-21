/*
  Warnings:

  - A unique constraint covering the columns `[categoryId]` on the table `CommissionRule` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "CommissionRule_categoryId_key" ON "CommissionRule"("categoryId");
