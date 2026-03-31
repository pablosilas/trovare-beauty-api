import prisma from "../../prisma.js";

export async function resumo(req, res) {
  try {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const pedidosHoje = await prisma.pedido.findMany({
      where: {
        tenantId:  req.tenantId,
        status:    "fechado",
        fechadoAt: { gte: hoje },
      },
      include: { pagamento: true, garcom: true },
    });

    const totalHoje = pedidosHoje.reduce((s, p) => s + p.total, 0);

    // Agrupa por forma de pagamento dinamicamente
    const porForma = {};
    pedidosHoje.forEach(p => {
      const forma = p.pagamento?.forma || "outros";
      porForma[forma] = (porForma[forma] || 0) + p.total;
    });

    const mesasAtivas = await prisma.mesa.count({
      where: { tenantId: req.tenantId, status: "ocupada" },
    });

    res.json({
      totalHoje,
      pedidosHoje: pedidosHoje.length,
      mesasAtivas,
      porForma, // ← objeto dinâmico com todas as formas
      // Mantém os campos antigos para compatibilidade
      totalPix:      porForma["pix"]      || 0,
      totalCartao:   (porForma["credito"] || 0) + (porForma["debito"] || 0),
      totalDinheiro: porForma["dinheiro"] || 0,
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