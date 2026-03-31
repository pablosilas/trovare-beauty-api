import prisma from "../../prisma.js";
import { emitToTenant } from "../../socket.js";

export async function list(req, res) {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.tenantId },
      select: { garcomModo: true },
    });

    // Se modo fixo E for garçom → filtra só os pedidos dele
    const where = {
      tenantId: req.tenantId,
      ...(tenant.garcomModo === "fixo" && req.garcomId
        ? { garcomId: req.garcomId }
        : {}),
    };

    const pedidos = await prisma.pedido.findMany({
      where,
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
    const {
      mesaId, garcomId, origem,
      nomeCliente, telefone, endereco,
      observacao, frete, formaPagamento,
    } = req.body;

    const pedido = await prisma.pedido.create({
      data: {
        tenantId: req.tenantId,
        mesaId: mesaId ? Number(mesaId) : null,
        garcomId: garcomId ? Number(garcomId) : null,
        origem: origem || "local",
        nomeCliente: nomeCliente || "",
        telefone: telefone || "",
        endereco: endereco || "",
        observacao: observacao || "",
        frete: frete ? Number(frete) : 0,
        total: frete ? Number(frete) : 0,
        formaPagamento: formaPagamento || "",
      },
      include: { mesa: true, garcom: true, itens: true },
    });

    if (mesaId) {
      await prisma.mesa.update({
        where: { id: Number(mesaId) },
        data: { status: "ocupada" },
      });
    }

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

    if (!item) return res.status(404).json({ error: "Item não encontrado" });

    // Verifica estoque
    if (item.temEstoque) {
      if (item.estoque <= 0) {
        return res.status(400).json({ error: "Item sem estoque disponível" });
      }
      if (item.estoque < Number(quantidade)) {
        return res.status(400).json({ error: `Estoque insuficiente. Disponível: ${item.estoque}` });
      }
    }

    await prisma.itemPedido.create({
      data: {
        pedidoId: Number(req.params.id),
        itemId: Number(itemId),
        quantidade: Number(quantidade) || 1,
        preco: item.preco * (Number(quantidade) || 1),
        obs: obs || "",
      },
    });

    // Desconta estoque se ativo
    if (item.temEstoque) {
      const novoEstoque = item.estoque - Number(quantidade);
      const updates = { estoque: novoEstoque };

      // Zera disponibilidade se chegou a 0
      if (novoEstoque <= 0) {
        updates.disponivel = false;
        updates.estoque = 0;
        // Emite alerta de estoque zerado
        emitToTenant(req.tenantId, "estoque:zerado", {
          itemId: item.id,
          nome: item.nome,
          estoque: 0,
        });
      } else if (novoEstoque <= item.estoqueMin) {
        // Emite alerta de estoque baixo
        emitToTenant(req.tenantId, "estoque:baixo", {
          itemId: item.id,
          nome: item.nome,
          estoque: novoEstoque,
          minimo: item.estoqueMin,
        });
      }

      await prisma.item.update({
        where: { id: item.id },
        data: updates,
      });
    }

    // Recalcula total
    const pedidoAtual = await prisma.pedido.findUnique({
      where: { id: Number(req.params.id) },
      include: { itens: true },
    });
    const totalItens = pedidoAtual.itens.reduce((s, i) => s + i.preco, 0);
    const total = totalItens + pedidoAtual.frete;

    await prisma.pedido.update({
      where: { id: Number(req.params.id) },
      data: { total },
    });

    const pedidoAtualizado = await prisma.pedido.findUnique({
      where: { id: Number(req.params.id) },
      include: { mesa: true, garcom: true, itens: { include: { item: true } } },
    });

    emitToTenant(req.tenantId, "pedido:atualizado", pedidoAtualizado);
    res.status(201).json(pedidoAtualizado);
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

    const formaPagamento = forma || pedido.formaPagamento || "dinheiro";


    await prisma.pagamentoFood.create({
      data: { pedidoId: pedido.id, forma: formaPagamento, total: pedido.total },
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

export async function cancelar(req, res) {
  try {
    const pedido = await prisma.pedido.findUnique({
      where: { id: Number(req.params.id) },
      include: { itens: { include: { item: true } } },
    });

    if (!pedido || pedido.tenantId !== req.tenantId) {
      return res.status(404).json({ error: "Pedido não encontrado" });
    }

    if (pedido.status === "fechado") {
      return res.status(400).json({ error: "Pedido já fechado não pode ser cancelado" });
    }

    if (pedido.status === "cancelado") {
      return res.status(400).json({ error: "Pedido já cancelado" });
    }

    // Devolve estoque dos itens
    for (const ip of pedido.itens) {
      if (ip.item?.temEstoque) {
        const novoEstoque = ip.item.estoque + ip.quantidade;
        await prisma.item.update({
          where: { id: ip.itemId },
          data: {
            estoque: novoEstoque,
            disponivel: true, // reativa o item se estava indisponível
          },
        });
      }
    }

    // Cancela o pedido
    const pedidoCancelado = await prisma.pedido.update({
      where: { id: pedido.id },
      data: { status: "cancelado" },
      include: { mesa: true, garcom: true, itens: { include: { item: true } } },
    });

    // Libera a mesa se não tiver outros pedidos ativos
    if (pedido.mesaId) {
      const outrosPedidos = await prisma.pedido.count({
        where: {
          mesaId: pedido.mesaId,
          tenantId: req.tenantId,
          status: { notIn: ["fechado", "cancelado"] },
        },
      });

      if (outrosPedidos === 0) {
        await prisma.mesa.update({
          where: { id: pedido.mesaId },
          data: { status: "livre" },
        });
      }
    }

    emitToTenant(req.tenantId, "pedido:cancelado", pedidoCancelado);
    res.json(pedidoCancelado);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}