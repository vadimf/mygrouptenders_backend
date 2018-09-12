import * as express from "express";
import { isAdministratorAuthenticated } from "../../../config/passport";
import {default as AdminRouter } from "./admin/admin";
import {default as AuthRouter } from "./auth/auth";
import {default as UsersRouter } from "./users/users";

const router = express.Router();

router.use("/auth",                                                 AuthRouter);
router.use("/admin",            isAdministratorAuthenticated(),     AdminRouter);
router.use("/users",            isAdministratorAuthenticated(),     UsersRouter);

export default router;
