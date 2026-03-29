import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function seed() {
  const tenantName = "Barbearia Exemplo";
  const tenantSlug = "barbearia-exemplo";
  const adminEmail = "admin@barbearia.com";
  const adminPass = "123456";

  const tenant = await prisma.tenant.create({
    data: { name: tenantName, slug: tenantSlug },
  });

  const hashed = await bcrypt.hash(adminPass, 10);
  await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: "Admin",
      email: adminEmail,
      password: hashed,
      role: "admin",
    },
  });

  console.log("✅ Tenant criado:", tenantName);
  console.log("✅ Usuário criado:", adminEmail);
  console.log("🔑 Senha:", adminPass);
  console.log("🆔 TenantId:", tenant.id);

  await prisma.$disconnect();
}

seed().catch(console.error);