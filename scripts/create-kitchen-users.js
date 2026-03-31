// scripts/create-kitchen-users.js
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function run() {
  const tenants = await prisma.tenant.findMany({
    where: { product: { in: ["food", "all"] } },
  });

  for (const tenant of tenants) {
    const existing = await prisma.user.findFirst({
      where: { tenantId: tenant.id, role: "kitchen" },
    });

    if (existing) {
      console.log(`✅ ${tenant.name} já tem kitchen`);
      continue;
    }

    const plainPassword = `kitchen${Math.floor(1000 + Math.random() * 9000)}`;
    const hashed = await bcrypt.hash(plainPassword, 10);
    const email = `kitchen.${tenant.slug}@trovare.internal`;

    await prisma.user.create({
      data: {
        tenantId: tenant.id,
        name: "Cozinha",
        email,
        password: hashed,
        role: "kitchen",
      },
    });

    console.log(`🍳 ${tenant.name} → ${email} / ${plainPassword}`);
  }

  await prisma.$disconnect();
}

run().catch(console.error);