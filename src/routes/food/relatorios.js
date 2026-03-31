import { Router } from "express";
import { saidasCardapio, alertasEstoque } from "../../controllers/food/relatorios.js";

const router = Router();

router.get("/saidas", saidasCardapio);
router.get("/alertas", alertasEstoque);

export default router;