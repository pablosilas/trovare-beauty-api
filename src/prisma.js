import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export const barber = prisma.barber;
export const client = prisma.client;
export const booking = prisma.booking;
export const commission = prisma.commission;
export const transaction = prisma.transaction;

export default prisma; // ← essa linha precisa estar aqui