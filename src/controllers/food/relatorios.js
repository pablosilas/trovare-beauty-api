import prisma from "../../prisma.js";

function getRange(periodo) {
  const now = new Date();
  const start = new Date();

  switch (periodo) {
    case "dia":
      start.setHours(0, 0, 0, 0);
      break;
    case "semana":
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      break;
    case "mes":
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;
    case "ano":
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      break;
    default:
      start.setHours(0, 0, 0, 0);
  }

  return { start, end: now };
}

export async function saidasCardapio(req, res) {
  try {
    const { periodo = "dia" } = req.query;
    const { start, end } = getRange(periodo);

    const itensPedido = await prisma.itemPedido.findMany({
      where: {
        pedido: {
          tenantId: req.tenantId,
          status: { not: "fechado" },
          createdAt: { gte: start, lte: end },
        },
      },
      include: {
        item: { include: { categoria: true } },
        pedido: true,
      },
    });

    // Agrupa por item
    const saidas = {};
    itensPedido.forEach(ip => {
      const id = ip.itemId;
      if (!saidas[id]) {
        saidas[id] = {
          id,
          nome: ip.item.nome,
          categoria: ip.item.categoria?.nome || "Sem categoria",
          preco: ip.item.preco,
          quantidade: 0,
          total: 0,
          temEstoque: ip.item.temEstoque,
          estoque: ip.item.estoque,
          estoqueMin: ip.item.estoqueMin,
        };
      }
      saidas[id].quantidade += ip.quantidade;
      saidas[id].total += ip.preco;
    });

    const resultado = Object.values(saidas)
      .sort((a, b) => b.quantidade - a.quantidade);

    res.json({
      periodo,
      start,
      end,
      totalItens: resultado.reduce((s, i) => s + i.quantidade, 0),
      totalReceita: resultado.reduce((s, i) => s + i.total, 0),
      itens: resultado,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function alertasEstoque(req, res) {
  try {
    const itens = await prisma.item.findMany({
      where: {
        tenantId: req.tenantId,
        temEstoque: true,
        OR: [
          { estoque: { lte: 0 } },
          { estoque: { lte: prisma.item.fields.estoqueMin } },
        ],
      },
      include: { categoria: true },
    });

    // Filtra manualmente pois Prisma não suporta comparação entre campos
    const todos = await prisma.item.findMany({
      where: { tenantId: req.tenantId, temEstoque: true },
      include: { categoria: true },
    });

    const alertas = todos
      .filter(i => i.estoque <= 0 || i.estoque <= i.estoqueMin)
      .map(i => ({
        id: i.id,
        nome: i.nome,
        categoria: i.categoria?.nome,
        estoque: i.estoque,
        estoqueMin: i.estoqueMin,
        zerado: i.estoque <= 0,
      }));

    res.json(alertas);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}