import { Router } from "express";
import { importarCardapio, downloadModelo } from "../../controllers/food/importacao.js";
import { upload } from "../../middleware/upload.js";

const router = Router();

router.get("/modelo", downloadModelo);
router.post("/cardapio", upload.single("arquivo"), importarCardapio);

export default router;