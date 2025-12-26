-- CreateEnum
CREATE TYPE "public"."OfferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "public"."offers" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "ctc" DOUBLE PRECISION NOT NULL,
    "joiningDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "offerMessage" TEXT,
    "offerExpiryDate" TIMESTAMP(3) NOT NULL,
    "status" "public"."OfferStatus" NOT NULL DEFAULT 'PENDING',
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "offers_applicationId_key" ON "public"."offers"("applicationId");

-- CreateIndex
CREATE INDEX "offers_userId_idx" ON "public"."offers"("userId");

-- CreateIndex
CREATE INDEX "offers_companyId_idx" ON "public"."offers"("companyId");

-- CreateIndex
CREATE INDEX "offers_status_idx" ON "public"."offers"("status");

-- CreateIndex
CREATE INDEX "offers_offerExpiryDate_idx" ON "public"."offers"("offerExpiryDate");

-- AddForeignKey
ALTER TABLE "public"."offers" ADD CONSTRAINT "offers_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

