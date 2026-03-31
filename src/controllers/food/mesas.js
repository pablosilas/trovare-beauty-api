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

export async function fecharMesa(req, res) {
  try {
    // Busca todos os pedidos ativos da mesa
    const pedidosAtivos = await prisma.pedido.findMany({
      where: {
        tenantId: req.tenantId,
        mesaId: Number(req.params.id),
        status: { notIn: ["fechado"] },
      },
    });

    if (pedidosAtivos.length === 0) {
      return res.status(400).json({ error: "Nenhum pedido ativo nessa mesa" });
    }

    // Muda todos para aguardando_pagamento
    await prisma.pedido.updateMany({
      where: {
        tenantId: req.tenantId,
        mesaId: Number(req.params.id),
        status: { notIn: ["fechado"] },
      },
      data: { status: "aguardando_pagamento" },
    });

    const { emitToTenant } = await import("../../socket.js");
    emitToTenant(req.tenantId, "mesa:fechada", { mesaId: Number(req.params.id) });

    res.json({ success: true, pedidos: pedidosAtivos.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}