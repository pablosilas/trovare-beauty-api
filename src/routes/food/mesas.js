import { Router } from "express";
import { list, create, update, remove, updateStatus, fecharMesa } from "../../controllers/food/mesas.js";

const router = Router();

router.get("/", list);
router.post("/", create);
router.put("/:id", update);
router.patch("/:id/status", updateStatus);
router.patch("/:id/fechar", fecharMesa);
router.delete("/:id", remove);

export default router;