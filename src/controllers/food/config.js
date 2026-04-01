import bcrypt from "bcryptjs";
import prisma from "../../prisma.js";

export async function getKitchenCredentials(req, res) {
  try {
    const kitchen = await prisma.user.findFirst({
      where: { tenantId: req.tenantId, role: "kitchen" },
      select: { id: true, name: true, email: true },
    });

    if (!kitchen) {
      return res.status(404).json({ error: "Usuário da cozinha não encontrado" });
    }

    res.json(kitchen);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function resetKitchenPassword(req, res) {
  try {
    const kitchen = await prisma.user.findFirst({
      where: { tenantId: req.tenantId, role: "kitchen" },
    });

    if (!kitchen) {
      return res.status(404).json({ error: "Usuário da cozinha não encontrado" });
    }

    const plainPassword = `kitchen${Math.floor(1000 + Math.random() * 9000)}`;
    const hashed = await bcrypt.hash(plainPassword, 10);

    await prisma.user.update({
      where: { id: kitchen.id },
      data: { password: hashed },
    });

    res.json({ email: kitchen.email, plainPassword });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function getConfig(req, res) {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.tenantId },
      select: {
        garcomModo: true,
        cancelamentoPermitido: true,
        cancelamentoAteStatus: true,
        name: true,
      },
    });
    res.json(tenant);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function updateConfig(req, res) {
  try {
    const { garcomModo, cancelamentoPermitido, cancelamentoAteStatus } = req.body;
    const tenant = await prisma.tenant.update({
      where: { id: req.tenantId },
      data: { garcomModo, cancelamentoPermitido, cancelamentoAteStatus },
      select: {
        garcomModo: true,
        cancelamentoPermitido: true,
        cancelamentoAteStatus: true,
        name: true,
      },
    });
    res.json(tenant);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}