import prisma from "../../prisma.js";

export async function list(req, res) {
  try {
    const garcons = await prisma.garcom.findMany({
      where: { tenantId: req.tenantId },
      orderBy: { nome: "asc" },
    });
    res.json(garcons);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function create(req, res) {
  try {
    const { nome, phone, commissionPct } = req.body;
    const garcom = await prisma.garcom.create({
      data: { tenantId: req.tenantId, nome, phone, commissionPct: Number(commissionPct) || 10 },
    });
    res.status(201).json(garcom);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function update(req, res) {
  try {
    const { nome, phone, commissionPct, status } = req.body;
    const garcom = await prisma.garcom.update({
      where: { id: Number(req.params.id), tenantId: req.tenantId },
      data: { nome, phone, commissionPct: Number(commissionPct), status },
    });
    res.json(garcom);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function remove(req, res) {
  try {
    await prisma.garcom.delete({
      where: { id: Number(req.params.id), tenantId: req.tenantId },
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}