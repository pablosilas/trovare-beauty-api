import { barber } from "../../prisma.js";

export async function list(req, res) {
  try {
    const barbers = await barber.findMany({
      where: { tenantId: req.tenantId }, // ← filtra pelo tenant
      orderBy: { createdAt: "asc" },
    });
    res.json(barbers);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function create(req, res) {
  try {
    const { name, phone, specialty, commissionPct, status } = req.body;
    const b = await barber.create({
      data: { tenantId: req.tenantId, name, phone, specialty, commissionPct: Number(commissionPct), status },
    });
    res.status(201).json(b);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function update(req, res) {
  try {
    const { name, phone, specialty, commissionPct, status } = req.body;
    const b = await barber.update({
      where: { id: Number(req.params.id), tenantId: req.tenantId },
      data: { name, phone, specialty, commissionPct: Number(commissionPct), status },
    });
    res.json(b);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function remove(req, res) {
  try {
    await barber.delete({
      where: { id: Number(req.params.id), tenantId: req.tenantId },
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}