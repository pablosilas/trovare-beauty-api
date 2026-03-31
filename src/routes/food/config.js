import { Router } from "express";
import {
  getKitchenCredentials, resetKitchenPassword,
  getConfig, updateConfig,
} from "../../controllers/food/config.js";

const router = Router();

router.get("/kitchen", getKitchenCredentials);
router.patch("/kitchen/reset", resetKitchenPassword);
router.get("/", getConfig);
router.patch("/", updateConfig);

export default router;