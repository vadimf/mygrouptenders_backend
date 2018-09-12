import * as express from "express";
import { isUserAuthenticated } from "../../config/passport";
import {default as AuthRouter } from "./auth/auth";
import {default as LanguagesRouter } from "./common/languages";
import {default as SystemRouter } from "./common/system";
import {default as UserRouter } from "./user/user";
import {default as AdminRouter } from "./admin/admin";

const router = express.Router();

router.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    req.jsonResponseRequested = true;
    next();
});

router.use("/system",                                           SystemRouter);
router.use("/languages",                                        LanguagesRouter);
router.use("/auth",                                             AuthRouter);
router.use("/admin",                                            AdminRouter);
router.use("/user",             isUserAuthenticated(),          UserRouter);

export default router;
