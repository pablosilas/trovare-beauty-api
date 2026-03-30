import { client } from "../prisma.js";

export async function list(req, res) {
  try {
    const clients = await client.findMany({
      where: { tenantId: req.tenantId },
      orderBy: { createdAt: "asc" },
    });
    res.json(clients);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function create(req, res) {
  try {
    const { name, phone, email, loyalty, notes } = req.body;
    const c = await client.create({
      data: { tenantId: req.tenantId, name, phone, email, loyalty, notes },
    });
    res.status(201).json(c);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function update(req, res) {
  try {
    const { name, phone, email, loyalty, notes, visits, spent } = req.body;
    const c = await client.update({
      where: { id: Number(req.params.id), tenantId: req.tenantId },
      data: { name, phone, email, loyalty, notes, visits, spent },
    });
    res.json(c);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function remove(req, res) {
  try {
    await client.delete({
      where: { id: Number(req.params.id), tenantId: req.tenantId },
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}