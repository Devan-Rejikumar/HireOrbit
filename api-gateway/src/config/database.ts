import { PrismaClient } from '@prisma/client';

console.log('[Database] User database URL:', process.env.DATABASE_URL);
console.log('[Database] Company database URL:', process.env.COMPANY_DATABASE_URL);

export const userDbClient = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

export const companyDbClient = new PrismaClient({
  datasources: {
    db: {
      url: process.env.COMPANY_DATABASE_URL,
    },
  },
});

export const connectDatabases = async () => {
  try {
    await userDbClient.$connect();
    await companyDbClient.$connect();
  } catch (error) {
    process.exit(1);
  }
};

export const disconnectDatabases = async () => {
  await userDbClient.$disconnect();
  await companyDbClient.$disconnect();
};
