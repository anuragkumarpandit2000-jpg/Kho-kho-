import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import playersRouter from "./players";
import trainingRouter from "./training";
import speedRouter from "./speed";
import coachRouter from "./coach";
import publicRouter from "./public";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(playersRouter);
router.use(trainingRouter);
router.use(speedRouter);
router.use(coachRouter);
router.use(publicRouter);

export default router;
