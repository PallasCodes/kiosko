import { Router } from "express";
import { healthRouter } from "../controllers/health.controller";

const router = Router();

router.use("/health", healthRouter);

export default router;
