import { Router } from "express";
import { saidasCardapio, alertasEstoque, logsCancelamento } from "../../controllers/food/relatorios.js";

const router = Router();

router.get("/saidas", saidasCardapio);
router.get("/alertas", alertasEstoque);
router.get("/cancelamentos", logsCancelamento);

export default router;