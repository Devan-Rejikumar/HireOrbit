-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userType" TEXT NOT NULL,
    "priceMonthly" DOUBLE PRECISION,
    "priceYearly" DOUBLE PRECISION,
    "stripePriceIdMonthly" TEXT,
    "stripePriceIdYearly" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "companyId" TEXT,
    "planId" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT NOT NULL,
    "stripeCustomerId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "billingPeriod" TEXT NOT NULL,
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionFeature" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "planId" TEXT NOT NULL,

    CONSTRAINT "SubscriptionFeature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobPostingLimit" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "currentCount" INTEGER NOT NULL DEFAULT 0,
    "limit" INTEGER NOT NULL,
    "resetDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobPostingLimit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_name_userType_key" ON "SubscriptionPlan"("name", "userType");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "Subscription_userId_idx" ON "Subscription"("userId");

-- CreateIndex
CREATE INDEX "Subscription_companyId_idx" ON "Subscription"("companyId");

-- CreateIndex
CREATE INDEX "Subscription_stripeSubscriptionId_idx" ON "Subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionFeature_name_planId_key" ON "SubscriptionFeature"("name", "planId");

-- CreateIndex
CREATE UNIQUE INDEX "JobPostingLimit_companyId_key" ON "JobPostingLimit"("companyId");

-- CreateIndex
CREATE INDEX "JobPostingLimit_companyId_idx" ON "JobPostingLimit"("companyId");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionFeature" ADD CONSTRAINT "SubscriptionFeature_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
