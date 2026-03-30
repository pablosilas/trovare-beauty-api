import { commission } from "../../prisma.js";

export async function list(req, res) {
  try {
    const commissions = await commission.findMany({
      where:   { tenantId: req.tenantId },
      include: { barber: true, booking: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(commissions);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function togglePaid(req, res) {
  try {
    const found = await commission.findUnique({
      where: { id: Number(req.params.id) },
    });

    if (!found || found.tenantId !== req.tenantId) {
      return res.status(404).json({ error: "Comissão não encontrada" });
    }

    const updated = await commission.update({
      where: { id: Number(req.params.id) },
      data:  { paid: !found.paid, paidAt: !found.paid ? new Date() : null },
    });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}