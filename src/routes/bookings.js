import { Router } from "express";
import { list, create, update, remove } from "../controllers/bookings.js";

const router = Router();

router.get("/", list);
router.post("/", create);
router.put("/:id", update);
router.delete("/:id", remove);

export default router;