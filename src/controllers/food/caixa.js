import prisma from "../../prisma.js";

export async function resumo(req, res) {
  try {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const pedidosHoje = await prisma.pedido.findMany({
      where: {
        tenantId: req.tenantId,
        status: "fechado",
        fechadoAt: { gte: hoje },
      },
      include: { pagamento: true, garcom: true },
    });

    const totalHoje = pedidosHoje.reduce((s, p) => s + p.total, 0);
    const totalDinheiro = pedidosHoje.filter(p => p.pagamento?.forma === "dinheiro").reduce((s, p) => s + p.total, 0);
    const totalCartao = pedidosHoje.filter(p => p.pagamento?.forma === "cartao").reduce((s, p) => s + p.total, 0);
    const totalPix = pedidosHoje.filter(p => p.pagamento?.forma === "pix").reduce((s, p) => s + p.total, 0);

    const mesasAtivas = await prisma.mesa.count({
      where: { tenantId: req.tenantId, status: "ocupada" },
    });

    res.json({
      totalHoje,
      totalDinheiro,
      totalCartao,
      totalPix,
      pedidosHoje: pedidosHoje.length,
      mesasAtivas,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function listPagamentos(req, res) {
  try {
    const pagamentos = await prisma.pagamentoFood.findMany({
      include: { pedido: { include: { mesa: true, garcom: true } } },
      orderBy: { createdAt: "desc" },
    });
    const filtered = pagamentos.filter(p => p.pedido.tenantId === req.tenantId);
    res.json(filtered);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function fecharPagamento(req, res) {
  try {
    const { pedidoId, forma } = req.body;
    const pedido = await prisma.pedido.findUnique({
      where: { id: Number(pedidoId) },
    });

    if (!pedido || pedido.tenantId !== req.tenantId) {
      return res.status(404).json({ error: "Pedido não encontrado" });
    }

    const pagamento = await prisma.pagamentoFood.create({
      data: { pedidoId: Number(pedidoId), forma, total: pedido.total },
    });

    await prisma.pedido.update({
      where: { id: Number(pedidoId) },
      data: { status: "fechado", fechadoAt: new Date() },
    });

    if (pedido.mesaId) {
      await prisma.mesa.update({
        where: { id: pedido.mesaId },
        data: { status: "livre" },
      });
    }

    res.status(201).json(pagamento);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}