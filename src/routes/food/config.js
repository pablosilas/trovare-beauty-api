import { Router } from "express";
import { getKitchenCredentials, resetKitchenPassword } from "../../controllers/food/config.js";

const router = Router();

router.get("/kitchen", getKitchenCredentials);
router.patch("/kitchen/reset", resetKitchenPassword);

export default router;