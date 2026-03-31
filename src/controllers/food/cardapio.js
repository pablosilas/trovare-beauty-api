import prisma from "../../prisma.js";

export async function listCategorias(req, res) {
  try {
    const categorias = await prisma.categoria.findMany({
      where: { tenantId: req.tenantId },
      include: { itens: { where: { disponivel: true }, orderBy: { nome: "asc" } } },
      orderBy: { ordem: "asc" },
    });
    res.json(categorias);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function createCategoria(req, res) {
  try {
    const { nome, ordem } = req.body;
    const categoria = await prisma.categoria.create({
      data: { tenantId: req.tenantId, nome, ordem: Number(ordem) || 0 },
    });
    res.status(201).json(categoria);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function updateCategoria(req, res) {
  try {
    const { nome, ordem, ativa } = req.body;
    const categoria = await prisma.categoria.update({
      where: { id: Number(req.params.id), tenantId: req.tenantId },
      data: { nome, ordem: Number(ordem), ativa },
    });
    res.json(categoria);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function removeCategoria(req, res) {
  try {
    await prisma.categoria.delete({
      where: { id: Number(req.params.id), tenantId: req.tenantId },
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function listItens(req, res) {
  try {
    const itens = await prisma.item.findMany({
      where: { tenantId: req.tenantId },
      include: { categoria: true },
      orderBy: { nome: "asc" },
    });
    res.json(itens);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function createItem(req, res) {
  try {
    const { categoriaId, nome, descricao, preco, temEstoque, estoque, estoqueMin } = req.body;
    const item = await prisma.item.create({
      data: {
        tenantId: req.tenantId,
        categoriaId: Number(categoriaId),
        nome,
        descricao: descricao || "",
        preco: Number(preco),
        temEstoque: temEstoque || false,
        estoque: temEstoque ? Number(estoque) || 0 : 0,
        estoqueMin: temEstoque ? Number(estoqueMin) || 0 : 0,
      },
    });
    res.status(201).json(item);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function updateItem(req, res) {
  try {
    const { categoriaId, nome, descricao, preco, disponivel, temEstoque, estoque, estoqueMin } = req.body;
    const item = await prisma.item.update({
      where: { id: Number(req.params.id), tenantId: req.tenantId },
      data: {
        categoriaId: Number(categoriaId),
        nome,
        descricao: descricao || "",
        preco: Number(preco),
        disponivel,
        temEstoque: temEstoque || false,
        estoque: temEstoque ? Number(estoque) || 0 : 0,
        estoqueMin: temEstoque ? Number(estoqueMin) || 0 : 0,
      },
    });
    res.status(200).json(item);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function removeItem(req, res) {
  try {
    await prisma.item.delete({
      where: { id: Number(req.params.id), tenantId: req.tenantId },
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}