import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function seed() {
  // Beauty
  const beauty = await prisma.tenant.create({
    data: { name: "Barbearia Exemplo", slug: "barbearia-exemplo", product: "beauty" },
  });
  await prisma.user.create({
    data: {
      tenantId: beauty.id, name: "Admin Beauty",
      email: "admin@barbearia.com",
      password: await bcrypt.hash("123456", 10), role: "admin",
    },
  });
  console.log("✅ Beauty — admin@barbearia.com / 123456");

  // Food
  const food = await prisma.tenant.create({
    data: { name: "Restaurante Exemplo", slug: "restaurante-exemplo", product: "food" },
  });
  await prisma.user.create({
    data: {
      tenantId: food.id, name: "Admin Food",
      email: "admin@restaurante.com",
      password: await bcrypt.hash("123456", 10), role: "admin",
    },
  });
  console.log("✅ Food — admin@restaurante.com / 123456");

  // Conta de teste — acessa tudo
  const demo = await prisma.tenant.create({
    data: { name: "Trovare Teste", slug: "trovare-demo", product: "all" },
  });
  await prisma.user.create({
    data: {
      tenantId: demo.id, name: "Teste Trovare",
      email: "teste@trovare.com",
      password: await bcrypt.hash("demo2026", 10), role: "admin",
    },
  });
  console.log("✅ Demo — teste@trovare.com / teste2026");

  await prisma.$disconnect();
}

seed().catch(console.error);