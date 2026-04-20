import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import assetsRouter from "./assets";
import transactionsRouter from "./transactions";
import portfolioRouter from "./portfolio";
import dashboardRouter from "./dashboard";
import notificationsRouter from "./notifications";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(assetsRouter);
router.use(transactionsRouter);
router.use(portfolioRouter);
router.use(dashboardRouter);
router.use(notificationsRouter);

export default router;
