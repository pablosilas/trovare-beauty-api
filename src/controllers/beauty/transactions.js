import { transaction } from "../prisma.js";

export async function list(req, res) {
  try {
    const transactions = await transaction.findMany({
      where: { tenantId: req.tenantId },
      orderBy: { createdAt: "desc" },
    });
    res.json(transactions);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function create(req, res) {
  try {
    const { type, description, category, amount, date, payment, barber } = req.body;
    const t = await transaction.create({
      data: { tenantId: req.tenantId, type, description, category, amount: Number(amount), date, payment, barber },
    });
    res.status(201).json(t);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function remove(req, res) {
  try {
    const found = await transaction.findUnique({
      where: { id: Number(req.params.id) },
    });

    if (!found || found.tenantId !== req.tenantId) {
      return res.status(404).json({ error: "Transação não encontrada" });
    }

    await transaction.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}