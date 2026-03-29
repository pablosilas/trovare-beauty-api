import { Router } from "express";
import {
  listTenants,
  createTenant,
  toggleTenant,
  resetPassword,
} from "../controllers/admin.js";
import { adminAuth } from "../middleware/adminAuth.js";

const router = Router();

router.use(adminAuth); // protege todas as rotas admin

router.get("/tenants", listTenants);
router.post("/tenants", createTenant);
router.patch("/tenants/:id/toggle", toggleTenant);
router.patch("/tenants/:id/reset-password", resetPassword);

export default router;