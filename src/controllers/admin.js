import "dotenv/config";
import bcrypt from "bcryptjs";
import prisma from "../prisma.js";

export async function listTenants(req, res) {
  try {
    const tenants = await prisma.tenant.findMany({
      include: { users: { select: { id: true, name: true, email: true, role: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(tenants);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function createTenant(req, res) {
  try {
    const { tenantName, slug, adminName, adminEmail, adminPassword, product } = req.body;

    const tenant = await prisma.tenant.create({
      data: { name: tenantName, slug, product: product || "beauty" },
    });

    const hashed = await bcrypt.hash(adminPassword, 10);
    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        name: adminName || "Admin",
        email: adminEmail,
        password: hashed,
        role: "admin",
      },
    });

    // Se for food ou all, cria login da cozinha automaticamente
    let kitchen = null;
    if (["food", "all"].includes(product)) {
      const kitchenEmail = `kitchen.${slug}@trovare.internal`;
      const kitchenPassword = `kitchen${Math.floor(1000 + Math.random() * 9000)}`;
      const kitchenHashed = await bcrypt.hash(kitchenPassword, 10);

      kitchen = await prisma.user.create({
        data: {
          tenantId: tenant.id,
          name: "Cozinha",
          email: kitchenEmail,
          password: kitchenHashed,
          role: "kitchen",
        },
      });

      kitchen.plainPassword = kitchenPassword;
    }

    res.status(201).json({
      tenant,
      user: { id: user.id, name: user.name, email: user.email },
      kitchen: kitchen ? {
        email: kitchen.email,
        plainPassword: kitchen.plainPassword,
      } : null,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function toggleTenant(req, res) {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: Number(req.params.id) },
    });

    if (!tenant) {
      return res.status(404).json({ error: "Cliente não encontrado" });
    }

    const updated = await prisma.tenant.update({
      where: { id: Number(req.params.id) },
      data: { active: !tenant.active },
    });

    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function resetPassword(req, res) {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: "Senha deve ter ao menos 6 caracteres" });
    }

    const user = await prisma.user.findFirst({
      where: { tenantId: Number(req.params.id), role: "admin" },
    });

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
    });

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}