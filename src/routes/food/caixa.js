import { Router } from "express";
import { resumo, listPagamentos, fecharPagamento } from "../../controllers/food/caixa.js";

const router = Router();

router.get("/resumo", resumo);
router.get("/pagamentos", listPagamentos);
router.post("/pagamentos", fecharPagamento);

export default router;