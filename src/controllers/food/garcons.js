import bcrypt from "bcryptjs";
import prisma from "../../prisma.js";

function generateUsername(nome) {
  const base = nome.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 10);
  return base;
}

function generatePassword(nome) {
  const base = nome.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]/g, "")
    .slice(0, 4);
  const nums = Math.floor(1000 + Math.random() * 9000);
  return `${base}${nums}`;
}

export async function list(req, res) {
  try {
    const garcons = await prisma.garcom.findMany({
      where: { tenantId: req.tenantId },
      orderBy: { nome: "asc" },
      select: {
        id: true, tenantId: true, nome: true,
        username: true, phone: true,
        commissionPct: true, status: true, createdAt: true,
      },
    });
    res.json(garcons);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function create(req, res) {
  try {
    const { nome, phone, commissionPct } = req.body;

    const username = generateUsername(nome);
    const plainPass = generatePassword(nome);
    const hashed = await bcrypt.hash(plainPass, 10);

    const existing = await prisma.garcom.findUnique({ where: { username } });
    const finalUsername = existing
      ? `${username}${Math.floor(10 + Math.random() * 90)}`
      : username;

    const garcom = await prisma.garcom.create({
      data: {
        tenantId: req.tenantId,
        nome,
        username: finalUsername,
        password: hashed,
        phone: phone || "",
        commissionPct: Number(commissionPct) || 10,
      },
      // ← sem select, retorna tudo
    });

    res.status(201).json({
      id: garcom.id,
      nome: garcom.nome,
      username: garcom.username,
      phone: garcom.phone,
      commissionPct: garcom.commissionPct,
      status: garcom.status,
      createdAt: garcom.createdAt,
      plainPassword: plainPass, // ← senha em texto puro só aqui
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function update(req, res) {
  try {
    const { nome, phone, commissionPct, status } = req.body;
    const garcom = await prisma.garcom.update({
      where: { id: Number(req.params.id), tenantId: req.tenantId },
      data: { nome, phone, commissionPct: Number(commissionPct), status },
      select: {
        id: true, tenantId: true, nome: true,
        username: true, phone: true,
        commissionPct: true, status: true, createdAt: true,
      },
    });
    res.json(garcom);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function remove(req, res) {
  try {
    await prisma.garcom.delete({
      where: { id: Number(req.params.id), tenantId: req.tenantId },
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function generateLogin(req, res) {
  try {
    const garcom = await prisma.garcom.findUnique({ where: { id: Number(req.params.id) } });
    const plainPass = generatePassword(garcom.nome);
    const hashed = await bcrypt.hash(plainPass, 10);

    await prisma.garcom.update({
      where: { id: Number(req.params.id) },
      data: { password: hashed },
    });

    res.json({ username: garcom.username, plainPassword: plainPass });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function resetPassword(req, res) {
  try {
    const { newPassword } = req.body;
    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.garcom.update({
      where: { id: Number(req.params.id), tenantId: req.tenantId },
      data: { password: hashed },
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}