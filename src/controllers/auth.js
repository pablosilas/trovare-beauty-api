import "dotenv/config";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import prisma from "../prisma.js";

export async function login(req, res) {
  try {
    const { email, password, product } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email e senha obrigatórios" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { tenant: true },
    });

    if (!user) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    if (!user.tenant.active) {
      return res.status(403).json({ error: "Conta inativa" });
    }

    if (product && user.tenant.product !== "all" && user.tenant.product !== product) {
      return res.status(403).json({ error: "Sua conta não tem acesso a este produto" });
    }

    const token = jwt.sign(
      { userId: user.id, tenantId: user.tenantId },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenant: {
          id: user.tenant.id,
          name: user.tenant.name,
          slug: user.tenant.slug,
          product: user.tenant.product,
        },
      },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function loginGarcom(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Usuário e senha obrigatórios" });
    }

    const garcom = await prisma.garcom.findUnique({
      where: { username },
      include: { tenant: true },
    });

    if (!garcom) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const validPassword = await bcrypt.compare(password, garcom.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    if (!garcom.tenant.active) {
      return res.status(403).json({ error: "Restaurante inativo" });
    }

    if (garcom.status !== "active") {
      return res.status(403).json({ error: "Sua conta está inativa" });
    }

    const token = jwt.sign(
      { garcomId: garcom.id, tenantId: garcom.tenantId, role: "garcom" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      garcom: {
        id: garcom.id,
        nome: garcom.nome,
        username: garcom.username,
        tenant: { id: garcom.tenant.id, name: garcom.tenant.name },
      },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function me(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { tenant: true },
    });
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        slug: user.tenant.slug,
        product: user.tenant.product,
      },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function meGarcom(req, res) {
  try {
    const garcom = await prisma.garcom.findUnique({
      where: { id: req.garcomId },
      include: { tenant: true },
      select: {
        id: true, nome: true, username: true,
        commissionPct: true, status: true,
        tenant: { select: { id: true, name: true } },
      },
    });
    res.json(garcom);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}