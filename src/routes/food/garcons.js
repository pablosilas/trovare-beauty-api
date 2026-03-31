import { Router } from "express";
import {
  list, create, update, remove,
  getLogin, generateLogin, resetPassword,
} from "../../controllers/food/garcons.js";

const router = Router();

router.get("/", list);
router.post("/", create);
router.put("/:id", update);
router.delete("/:id", remove);
router.get("/:id/login", getLogin);
router.post("/:id/generate-login", generateLogin);
router.patch("/:id/reset-password", resetPassword);

export default router;