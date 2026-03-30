import "dotenv/config";
import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import barbersRoutes from "./routes/barbers.js";
import clientsRoutes from "./routes/clients.js";
import bookingsRoutes from "./routes/bookings.js";
import commissionsRoutes from "./routes/commissions.js";
import transactionsRoutes from "./routes/transactions.js";

import { authMiddleware } from "./middleware/auth.js";

const app = express();
app.use(cors({
  origin: [
    "https://trovare-beauty.vercel.app",
    "http://localhost:5173",
  ],
  credentials: true,
}));
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/admin", adminRoutes); // ← rota admin
app.get("/", (req, res) => res.json({ status: "BarberOS API running!" }));

app.use("/barbers", authMiddleware, barbersRoutes);
app.use("/clients", authMiddleware, clientsRoutes);
app.use("/bookings", authMiddleware, bookingsRoutes);
app.use("/commissions", authMiddleware, commissionsRoutes);
app.use("/transactions", authMiddleware, transactionsRoutes);

const PORT = process.env.PORT || 3333;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));