import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { setIO } from "./socket.js";

import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import barbersRoutes from "./routes/beauty/barbers.js";
import clientsRoutes from "./routes/beauty/clients.js";
import bookingsRoutes from "./routes/beauty/bookings.js";
import commissionsRoutes from "./routes/beauty/commissions.js";
import transactionsRoutes from "./routes/beauty/transactions.js";
import mesasRoutes from "./routes/food/mesas.js";
import cardapioRoutes from "./routes/food/cardapio.js";
import pedidosRoutes from "./routes/food/pedidos.js";
import garconsRoutes from "./routes/food/garcons.js";
import caixaFoodRoutes from "./routes/food/caixa.js";
import configFoodRoutes from "./routes/food/config.js";
import relatoriosRoutes from "./routes/food/relatorios.js";
import importacaoRoutes from "./routes/food/importacao.js";
import { authMiddleware } from "./middleware/auth.js";

const app = express();
const server = createServer(app);

export const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

setIO(io);

app.use(cors({
  origin: [
    "https://trovare-beauty.vercel.app",
    "https://trovare-food.vercel.app",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
  ],
  credentials: true,
}));

app.use(express.json());

app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.get("/", (req, res) => res.json({ status: "Trovare API running!" }));

app.use("/beauty/barbers", authMiddleware, barbersRoutes);
app.use("/beauty/clients", authMiddleware, clientsRoutes);
app.use("/beauty/bookings", authMiddleware, bookingsRoutes);
app.use("/beauty/commissions", authMiddleware, commissionsRoutes);
app.use("/beauty/transactions", authMiddleware, transactionsRoutes);

app.use("/food/mesas", authMiddleware, mesasRoutes);
app.use("/food/cardapio", authMiddleware, cardapioRoutes);
app.use("/food/pedidos", authMiddleware, pedidosRoutes);
app.use("/food/garcons", authMiddleware, garconsRoutes);
app.use("/food/caixa", authMiddleware, caixaFoodRoutes);
app.use("/food/config", authMiddleware, configFoodRoutes);
app.use("/food/relatorios", authMiddleware, relatoriosRoutes);
app.use("/food/importacao", authMiddleware, importacaoRoutes);




io.on("connection", (socket) => {
  console.log(`🔌 Conectado: ${socket.id}`);

  socket.on("join-tenant", (tenantId) => {
    socket.join(`tenant-${tenantId}`);
    console.log(`📡 tenant-${tenantId}`);
  });

  socket.on("disconnect", () => {
    console.log(`❌ Desconectado: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3333;
server.listen(PORT, () => console.log(`🚀 Trovare API running on port ${PORT}`));