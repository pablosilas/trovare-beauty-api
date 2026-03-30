import { Router } from "express";
import { list, togglePaid } from "../../controllers/commissions.js";

const router = Router();

router.get("/", list);
router.put("/:id", togglePaid);

export default router;