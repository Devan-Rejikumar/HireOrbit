import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

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
  console.log(' Starting database seed...\n');

  console.log('Creating User subscription plans...');
  const userFreePlan = await prisma.subscriptionPlan.upsert({
    where: { name_userType: { name: 'Free', userType: 'user' } },
    update: {
      priceMonthly: PRICES.USER_FREE,
      stripePriceIdMonthly: STRIPE_PRICE_IDS.USER_FREE_MONTHLY || undefined,
    },
    create: {
      name: 'Free',
      userType: 'user',
      priceMonthly: PRICES.USER_FREE,
      stripePriceIdMonthly: STRIPE_PRICE_IDS.USER_FREE_MONTHLY || undefined,
    },
  });
  console.log(' User Free Plan created/updated');

  const userPremiumPlan = await prisma.subscriptionPlan.upsert({
    where: { name_userType: { name: 'Premium', userType: 'user' } },
    update: {
      priceMonthly: PRICES.USER_PREMIUM,
      stripePriceIdMonthly: STRIPE_PRICE_IDS.USER_PREMIUM_MONTHLY || undefined,
    },
    create: {
      name: 'Premium',
      userType: 'user',
      priceMonthly: PRICES.USER_PREMIUM,
      stripePriceIdMonthly: STRIPE_PRICE_IDS.USER_PREMIUM_MONTHLY || undefined,
    },
  });
  console.log(' User Premium Plan created/updated');


  console.log('\nCreating Company subscription plans...');

  const companyFreePlan = await prisma.subscriptionPlan.upsert({
    where: { name_userType: { name: 'Free', userType: 'company' } },
    update: {
      priceMonthly: PRICES.COMPANY_FREE,
      stripePriceIdMonthly: STRIPE_PRICE_IDS.COMPANY_FREE_MONTHLY || undefined,
    },
    create: {
      name: 'Free',
      userType: 'company',
      priceMonthly: PRICES.COMPANY_FREE,
      stripePriceIdMonthly: STRIPE_PRICE_IDS.COMPANY_FREE_MONTHLY || undefined,
    },
  });
  console.log('Company Free Plan created/updated');

  const companyBasicPlan = await prisma.subscriptionPlan.upsert({
    where: { name_userType: { name: 'Basic', userType: 'company' } },
    update: {
      priceMonthly: PRICES.COMPANY_BASIC_MONTHLY,
      priceYearly: PRICES.COMPANY_BASIC_YEARLY,
      stripePriceIdMonthly: STRIPE_PRICE_IDS.COMPANY_BASIC_MONTHLY || undefined,
      stripePriceIdYearly: STRIPE_PRICE_IDS.COMPANY_BASIC_YEARLY || undefined,
    },
    create: {
      name: 'Basic',
      userType: 'company',
      priceMonthly: PRICES.COMPANY_BASIC_MONTHLY,
      priceYearly: PRICES.COMPANY_BASIC_YEARLY,
      stripePriceIdMonthly: STRIPE_PRICE_IDS.COMPANY_BASIC_MONTHLY || undefined,
      stripePriceIdYearly: STRIPE_PRICE_IDS.COMPANY_BASIC_YEARLY || undefined,
    },
  });
  console.log('Company Basic Plan created/updated');

  const companyPremiumPlan = await prisma.subscriptionPlan.upsert({
    where: { name_userType: { name: 'Premium', userType: 'company' } },
    update: {
      priceMonthly: PRICES.COMPANY_PREMIUM_MONTHLY,
      priceYearly: PRICES.COMPANY_PREMIUM_YEARLY,
      stripePriceIdMonthly: STRIPE_PRICE_IDS.COMPANY_PREMIUM_MONTHLY || undefined,
      stripePriceIdYearly: STRIPE_PRICE_IDS.COMPANY_PREMIUM_YEARLY || undefined,
    },
    create: {
      name: 'Premium',
      userType: 'company',
      priceMonthly: PRICES.COMPANY_PREMIUM_MONTHLY,
      priceYearly: PRICES.COMPANY_PREMIUM_YEARLY,
      stripePriceIdMonthly: STRIPE_PRICE_IDS.COMPANY_PREMIUM_MONTHLY || undefined,
      stripePriceIdYearly: STRIPE_PRICE_IDS.COMPANY_PREMIUM_YEARLY || undefined,
    },
  });
  console.log('Company Premium Plan created/updated');

  console.log('\nAdding features to plans...');

  await prisma.subscriptionFeature.upsert({
    where: { name_planId: { name: 'ats_checker', planId: userPremiumPlan.id } },
    update: {},
    create: {
      name: 'ats_checker',
      planId: userPremiumPlan.id,
    },
  });
  console.log('Added ATS Checker to User Premium');
  await prisma.subscriptionFeature.upsert({
    where: { name_planId: { name: 'user_profile_search', planId: companyBasicPlan.id } },
    update: {},
    create: {
      name: 'user_profile_search',
      planId: companyBasicPlan.id,
    },
  });
  console.log('Added User Profile Search to Company Basic');

  await prisma.subscriptionFeature.upsert({
    where: { name_planId: { name: 'company_ats_filter', planId: companyBasicPlan.id } },
    update: {},
    create: {
      name: 'company_ats_filter',
      planId: companyBasicPlan.id,
    },
  });
  console.log('Added Company ATS Filter to Company Basic');

  await prisma.subscriptionFeature.upsert({
    where: { name_planId: { name: 'enhanced_analytics', planId: companyBasicPlan.id } },
    update: {},
    create: {
      name: 'enhanced_analytics',
      planId: companyBasicPlan.id,
    },
  });
  console.log('Added Enhanced Analytics to Company Basic');
  await prisma.subscriptionFeature.upsert({
    where: { name_planId: { name: 'user_profile_search', planId: companyPremiumPlan.id } },
    update: {},
    create: {
      name: 'user_profile_search',
      planId: companyPremiumPlan.id,
    },
  });
  console.log('Added User Profile Search to Company Premium');
  await prisma.subscriptionFeature.upsert({
    where: { name_planId: { name: 'company_ats_filter', planId: companyPremiumPlan.id } },
    update: {},
    create: {
      name: 'company_ats_filter',
      planId: companyPremiumPlan.id,
    },
  });
  console.log('Added Company ATS Filter to Company Premium');
  await prisma.subscriptionFeature.upsert({
    where: { name_planId: { name: 'featured_jobs', planId: companyPremiumPlan.id } },
    update: {},
    create: {
      name: 'featured_jobs',
      planId: companyPremiumPlan.id,
    },
  });
  console.log(' Added Featured Jobs to Company Premium');
  await prisma.subscriptionFeature.upsert({
    where: { name_planId: { name: 'unlimited_jobs', planId: companyPremiumPlan.id } },
    update: {},
    create: {
      name: 'unlimited_jobs',
      planId: companyPremiumPlan.id,
    },
  });
  console.log('Added Unlimited Jobs to Company Premium');

  await prisma.subscriptionFeature.upsert({
    where: { name_planId: { name: 'advanced_analytics', planId: companyPremiumPlan.id } },
    update: {},
    create: {
      name: 'advanced_analytics',
      planId: companyPremiumPlan.id,
    },
  });
  console.log('Added Advanced Analytics to Company Premium');

  console.log('Database seed completed successfully!');
  console.log('Note: If some Price IDs are null, update them in the seed file and run again.');
}
main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

