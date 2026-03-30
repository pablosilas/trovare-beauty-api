import prisma from "../../prisma.js";

export async function list(req, res) {
  try {
    const mesas = await prisma.mesa.findMany({
      where: { tenantId: req.tenantId },
      include: { pedidos: { where: { status: { not: "fechado" } }, include: { itens: true } } },
      orderBy: { numero: "asc" },
    });
    res.json(mesas);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function create(req, res) {
  try {
    const { numero, capacidade } = req.body;
    const mesa = await prisma.mesa.create({
      data: { tenantId: req.tenantId, numero: Number(numero), capacidade: Number(capacidade) },
    });
    res.status(201).json(mesa);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function update(req, res) {
  try {
    const { numero, capacidade } = req.body;
    const mesa = await prisma.mesa.update({
      where: { id: Number(req.params.id), tenantId: req.tenantId },
      data: { numero: Number(numero), capacidade: Number(capacidade) },
    });
    res.json(mesa);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function updateStatus(req, res) {
  try {
    const { status } = req.body;
    const mesa = await prisma.mesa.update({
      where: { id: Number(req.params.id), tenantId: req.tenantId },
      data: { status },
    });
    res.json(mesa);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function remove(req, res) {
  try {
    await prisma.mesa.delete({
      where: { id: Number(req.params.id), tenantId: req.tenantId },
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}