import { PrismaClient } from '../generated/prisma-main';

const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.__prismaMain ??
  new PrismaClient({
    log: ['error', 'warn']
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__prismaMain = prisma;
}

export default prisma;
