#!/usr/bin/env node
require('dotenv/config');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const STRIPE_PRICE_IDS = {
  USER_FREE_MONTHLY: "price_1SZUSzGjwFPHmyErOAhsbjM3",
  USER_PREMIUM_MONTHLY: "price_1SZUsoGjwFPHmyErVPgXv4PG",
  COMPANY_FREE_MONTHLY: "price_1SZXYeGjwFPHmyEruMH6bMcC",
  COMPANY_BASIC_MONTHLY: "price_1SZXapGjwFPHmyErCOVxKxQC",
  COMPANY_BASIC_YEARLY: "price_1SZXpqGjwFPHmyErE7b1VJ7e",
  COMPANY_PREMIUM_MONTHLY: "price_1SZXrcGjwFPHmyEr2cIM5yUm",
  COMPANY_PREMIUM_YEARLY: "price_1SZXs4GjwFPHmyEr5ENTvLfm",
};

const PRICES = {
  USER_FREE: 0,
  USER_PREMIUM: 299,
  COMPANY_FREE: 0,
  COMPANY_BASIC_MONTHLY: 899,
  COMPANY_BASIC_YEARLY: 8990,
  COMPANY_PREMIUM_MONTHLY: 2299,
  COMPANY_PREMIUM_YEARLY: 22990,
};

async function main() {
  console.log('🌱 Starting database seed');

  // USER PLANS
  const userFreePlan = await prisma.subscriptionPlan.upsert({
    where: { name_userType: { name: 'Free', userType: 'user' } },
    update: {},
    create: {
      name: 'Free',
      userType: 'user',
      priceMonthly: PRICES.USER_FREE,
      stripePriceIdMonthly: STRIPE_PRICE_IDS.USER_FREE_MONTHLY,
    },
  });

  const userPremiumPlan = await prisma.subscriptionPlan.upsert({
    where: { name_userType: { name: 'Premium', userType: 'user' } },
    update: {},
    create: {
      name: 'Premium',
      userType: 'user',
      priceMonthly: PRICES.USER_PREMIUM,
      stripePriceIdMonthly: STRIPE_PRICE_IDS.USER_PREMIUM_MONTHLY,
    },
  });

  // COMPANY PLANS
  const companyFreePlan = await prisma.subscriptionPlan.upsert({
    where: { name_userType: { name: 'Free', userType: 'company' } },
    update: {},
    create: {
      name: 'Free',
      userType: 'company',
      priceMonthly: PRICES.COMPANY_FREE,
      stripePriceIdMonthly: STRIPE_PRICE_IDS.COMPANY_FREE_MONTHLY,
    },
  });

  const companyBasicPlan = await prisma.subscriptionPlan.upsert({
    where: { name_userType: { name: 'Basic', userType: 'company' } },
    update: {},
    create: {
      name: 'Basic',
      userType: 'company',
      priceMonthly: PRICES.COMPANY_BASIC_MONTHLY,
      priceYearly: PRICES.COMPANY_BASIC_YEARLY,
      stripePriceIdMonthly: STRIPE_PRICE_IDS.COMPANY_BASIC_MONTHLY,
      stripePriceIdYearly: STRIPE_PRICE_IDS.COMPANY_BASIC_YEARLY,
    },
  });

  const companyPremiumPlan = await prisma.subscriptionPlan.upsert({
    where: { name_userType: { name: 'Premium', userType: 'company' } },
    update: {},
    create: {
      name: 'Premium',
      userType: 'company',
      priceMonthly: PRICES.COMPANY_PREMIUM_MONTHLY,
      priceYearly: PRICES.COMPANY_PREMIUM_YEARLY,
      stripePriceIdMonthly: STRIPE_PRICE_IDS.COMPANY_PREMIUM_MONTHLY,
      stripePriceIdYearly: STRIPE_PRICE_IDS.COMPANY_PREMIUM_YEARLY,
    },
  });

  // FEATURES
  await prisma.subscriptionFeature.upsert({
    where: { name_planId: { name: 'ats_checker', planId: userPremiumPlan.id } },
    update: {},
    create: { name: 'ats_checker', planId: userPremiumPlan.id },
  });

  await prisma.subscriptionFeature.upsert({
    where: { name_planId: { name: 'unlimited_jobs', planId: companyPremiumPlan.id } },
    update: {},
    create: { name: 'unlimited_jobs', planId: companyPremiumPlan.id },
  });

  console.log(' Database seed completed successfully');
}

main()
  .catch(err => {
    console.error(' Seed failed', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
