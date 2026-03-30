import { Router } from "express";
import {
  listCategorias, createCategoria, updateCategoria, removeCategoria,
  listItens, createItem, updateItem, removeItem,
} from "../../controllers/food/cardapio.js";

const router = Router();

router.get("/categorias", listCategorias);
router.post("/categorias", createCategoria);
router.put("/categorias/:id", updateCategoria);
router.delete("/categorias/:id", removeCategoria);

router.get("/itens", listItens);
router.post("/itens", createItem);
router.put("/itens/:id", updateItem);
router.delete("/itens/:id", removeItem);

export default router;