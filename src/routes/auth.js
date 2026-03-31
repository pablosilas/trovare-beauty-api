import { Router } from "express";
import { login, me, loginGarcom, meGarcom } from "../controllers/auth.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

router.post("/login", login);
router.post("/login/garcom", loginGarcom);
router.get("/me", authMiddleware, me);
router.get("/me/garcom", authMiddleware, meGarcom);

export default router;