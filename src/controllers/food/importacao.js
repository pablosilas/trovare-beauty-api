import * as XLSX from "xlsx";
import prisma from "../../prisma.js";

function parseBoolean(value) {
  if (!value) return true;
  const str = String(value).toLowerCase().trim();
  return !["nao", "não", "no", "false", "0", "n"].includes(str);
}

function parsePreco(value) {
  if (!value) return 0;
  return parseFloat(
    String(value)
      .replace(/[^\d.,]/g, "")
      .replace(",", ".")
  ) || 0;
}

export async function importarCardapio(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado" });
    }

    // Lê o arquivo
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    if (rows.length === 0) {
      return res.status(400).json({ error: "Planilha vazia ou sem dados válidos" });
    }

    // Valida colunas mínimas
    const firstRow = rows[0];
    if (!firstRow.categoria && !firstRow.nome) {
      return res.status(400).json({
        error: "Planilha inválida. Verifique se tem as colunas: categoria, nome, preco",
      });
    }

    let criados = 0;
    let ignorados = 0;
    const erros = [];

    // Cache de categorias para não criar duplicatas
    const categoriasCache = {};

    for (const [index, row] of rows.entries()) {
      try {
        const nomeItem = String(row.nome || "").trim();
        const nomeCategoria = String(row.categoria || "Geral").trim();
        const preco = parsePreco(row.preco);

        if (!nomeItem) {
          ignorados++;
          continue;
        }

        if (preco <= 0) {
          erros.push(`Linha ${index + 2}: "${nomeItem}" — preço inválido`);
          ignorados++;
          continue;
        }

        // Busca ou cria a categoria
        if (!categoriasCache[nomeCategoria]) {
          let cat = await prisma.categoria.findFirst({
            where: { tenantId: req.tenantId, nome: nomeCategoria },
          });

          if (!cat) {
            cat = await prisma.categoria.create({
              data: {
                tenantId: req.tenantId,
                nome: nomeCategoria,
                ordem: Object.keys(categoriasCache).length,
              },
            });
          }

          categoriasCache[nomeCategoria] = cat.id;
        }

        // Verifica se o item já existe
        const itemExistente = await prisma.item.findFirst({
          where: {
            tenantId: req.tenantId,
            categoriaId: categoriasCache[nomeCategoria],
            nome: nomeItem,
          },
        });

        if (itemExistente) {
          ignorados++;
          continue;
        }

        // Cria o item
        await prisma.item.create({
          data: {
            tenantId: req.tenantId,
            categoriaId: categoriasCache[nomeCategoria],
            nome: nomeItem,
            descricao: String(row.descricao || "").trim(),
            preco,
            disponivel: parseBoolean(row.disponivel),
          },
        });

        criados++;
      } catch (e) {
        erros.push(`Linha ${index + 2}: erro ao processar — ${e.message}`);
        ignorados++;
      }
    }

    res.json({
      sucesso: true,
      criados,
      ignorados,
      erros,
      total: rows.length,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function downloadModelo(req, res) {
  try {
    const modelo = [
      {
        categoria: "Entradas",
        nome: "Frango Grelhado",
        descricao: "Acompanha arroz e salada",
        preco: 25.90,
        disponivel: "sim",
      },
      {
        categoria: "Entradas",
        nome: "Salada Caesar",
        descricao: "Com croutons e parmesão",
        preco: 18.00,
        disponivel: "sim",
      },
      {
        categoria: "Bebidas",
        nome: "Coca-Cola Lata",
        descricao: "350ml gelada",
        preco: 6.00,
        disponivel: "sim",
      },
      {
        categoria: "Bebidas",
        nome: "Suco de Laranja",
        descricao: "Natural 500ml",
        preco: 12.00,
        disponivel: "sim",
      },
      {
        categoria: "Sobremesas",
        nome: "Pudim",
        descricao: "Pudim de leite condensado",
        preco: 9.00,
        disponivel: "sim",
      },
    ];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(modelo);

    // Largura das colunas
    worksheet["!cols"] = [
      { wch: 20 }, // categoria
      { wch: 30 }, // nome
      { wch: 40 }, // descricao
      { wch: 10 }, // preco
      { wch: 12 }, // disponivel
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, "Cardápio");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Disposition", "attachment; filename=modelo-cardapio.xlsx");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(buffer);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}