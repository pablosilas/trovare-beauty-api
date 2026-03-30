import "dotenv/config";
import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";

import barbersRoutes from "./routes/beauty/barbers.js";
import clientsRoutes from "./routes/beauty/clients.js";
import bookingsRoutes from "./routes/beauty/bookings.js";
import commissionsRoutes from "./routes/beauty/commissions.js";
import transactionsRoutes from "./routes/beauty/transactions.js";

import { authMiddleware } from "./middleware/auth.js";

const app = express();

app.use(cors({
  origin: [
    "https://trovare-beauty.vercel.app",
    "http://localhost:5173",
    "http://localhost:5174",
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

const PORT = process.env.PORT || 3333;
app.listen(PORT, () => console.log(`🚀 Trovare API running on port ${PORT}`));