import prisma from "../../prisma.js";
import { emitToTenant } from "../../socket.js";

export async function list(req, res) {
  try {
    const pedidos = await prisma.pedido.findMany({
      where: { tenantId: req.tenantId },
      include: { mesa: true, garcom: true, itens: { include: { item: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(pedidos);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function get(req, res) {
  try {
    const pedido = await prisma.pedido.findUnique({
      where: { id: Number(req.params.id) },
      include: { mesa: true, garcom: true, itens: { include: { item: true } }, pagamento: true },
    });
    if (!pedido || pedido.tenantId !== req.tenantId) {
      return res.status(404).json({ error: "Pedido não encontrado" });
    }
    res.json(pedido);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function create(req, res) {
  try {
    const { mesaId, garcomId } = req.body;
    const pedido = await prisma.pedido.create({
      data: {
        tenantId: req.tenantId,
        mesaId: mesaId ? Number(mesaId) : null,
        garcomId: garcomId ? Number(garcomId) : null,
      },
      include: { mesa: true, garcom: true, itens: true },
    });

    if (mesaId) {
      await prisma.mesa.update({
        where: { id: Number(mesaId) },
        data: { status: "ocupada" },
      });
    }

    // Emite evento para a cozinha e food
    emitToTenant(req.tenantId, "pedido:novo", pedido);

    res.status(201).json(pedido);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function addItem(req, res) {
  try {
    const { itemId, quantidade, obs } = req.body;
    const item = await prisma.item.findUnique({ where: { id: Number(itemId) } });

    const itemPedido = await prisma.itemPedido.create({
      data: {
        pedidoId: Number(req.params.id),
        itemId: Number(itemId),
        quantidade: Number(quantidade) || 1,
        preco: item.preco,
        obs: obs || "",
      },
      include: { item: true },
    });

    const total = await prisma.itemPedido.aggregate({
      where: { pedidoId: Number(req.params.id) },
      _sum: { preco: true },
    });

    await prisma.pedido.update({
      where: { id: Number(req.params.id) },
      data: { total: total._sum.preco || 0 },
    });

    // Busca pedido atualizado e emite
    const pedidoAtualizado = await prisma.pedido.findUnique({
      where: { id: Number(req.params.id) },
      include: { mesa: true, garcom: true, itens: { include: { item: true } } },
    });

    emitToTenant(req.tenantId, "pedido:atualizado", pedidoAtualizado);

    res.status(201).json(itemPedido);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function removeItem(req, res) {
  try {
    await prisma.itemPedido.delete({
      where: { id: Number(req.params.itemId) },
    });

    const total = await prisma.itemPedido.aggregate({
      where: { pedidoId: Number(req.params.id) },
      _sum: { preco: true },
    });

    await prisma.pedido.update({
      where: { id: Number(req.params.id) },
      data: { total: total._sum.preco || 0 },
    });

    const pedidoAtualizado = await prisma.pedido.findUnique({
      where: { id: Number(req.params.id) },
      include: { mesa: true, garcom: true, itens: { include: { item: true } } },
    });

    emitToTenant(req.tenantId, "pedido:atualizado", pedidoAtualizado);

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function updateStatus(req, res) {
  try {
    const { status } = req.body;
    const pedido = await prisma.pedido.update({
      where: { id: Number(req.params.id), tenantId: req.tenantId },
      data: { status },
      include: { mesa: true, garcom: true, itens: { include: { item: true } } },
    });

    // Emite status atualizado
    emitToTenant(req.tenantId, "pedido:status", pedido);

    res.json(pedido);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function fechar(req, res) {
  try {
    const { forma } = req.body;
    const pedido = await prisma.pedido.findUnique({
      where: { id: Number(req.params.id) },
      include: { itens: true },
    });

    if (!pedido || pedido.tenantId !== req.tenantId) {
      return res.status(404).json({ error: "Pedido não encontrado" });
    }

    await prisma.pagamentoFood.create({
      data: { pedidoId: pedido.id, forma, total: pedido.total },
    });

    const pedidoFechado = await prisma.pedido.update({
      where: { id: pedido.id },
      data: { status: "fechado", fechadoAt: new Date() },
      include: { mesa: true, garcom: true, itens: { include: { item: true } } },
    });

    if (pedido.mesaId) {
      await prisma.mesa.update({
        where: { id: pedido.mesaId },
        data: { status: "livre" },
      });
    }

    emitToTenant(req.tenantId, "pedido:fechado", pedidoFechado);

    res.json(pedidoFechado);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}