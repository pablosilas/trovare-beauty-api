import { Router } from "express";
import { list, get, create, addItem, removeItem, updateStatus, fechar } from "../../controllers/food/pedidos.js";

const router = Router();

router.get("/", list);
router.get("/:id", get);
router.post("/", create);
router.post("/:id/itens", addItem);
router.delete("/:id/itens/:itemId", removeItem);
router.patch("/:id/status", updateStatus);
router.patch("/:id/fechar", fechar);

export default router;