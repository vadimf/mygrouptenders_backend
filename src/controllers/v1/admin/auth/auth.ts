import * as express from "express";
import { isAdministratorAuthenticated } from "../../../../config/passport";
import { AppError } from "../../../../models/app-error";
import { Administrator } from "../../../../models/user/administrator";
import { IAuthenticationTokenDocument } from "../../../../models/user/authentication-token";
import { AsyncMiddleware } from "../../../../server";

const router = express.Router();

router
    .post(
        "/sign-in",
        AsyncMiddleware(async (req: express.Request, res: express.Response) => {
            req.checkBody({
                email: {
                    isEmail: {
                        errorMessage: "Email invalid",
                    },
                },
            });

            await req.validateRequest();

            if ( ! (await Administrator.count({})) ) {
                const defaultAdministrator = new Administrator({
                    firstName: "אירית",
                    lastName: "נאמן",
                    email: "irit@uma.mom",
                });

                defaultAdministrator.changePassword("6hYWEkmCDR64cqkZ");

                await defaultAdministrator.save();
            }

            const password: string = String(req.body.password || "");
            const email: string = String(req.body.email || "").toLowerCase();

            const admin = await Administrator.getSingle({
                email: email,
            });

            if ( ! admin ) {
                throw AppError.ObjectDoesNotExist;
            }

            const currentPassword = admin.getCurrentPassword();
            if ( ! currentPassword || ! currentPassword.compare(password) ) {
                throw AppError.PasswordDoesNotMatch;
            }

            const token = admin.createAuthToken();

            await admin.save();

            res.response({
                admin: admin,
                token: token.authToken,
            });
        }),
    )

    .delete(
        "/",
        isAdministratorAuthenticated(),
        AsyncMiddleware(async (req: express.Request, res: express.Response) => {
            const currentAuthenticationToken = req.authToken as IAuthenticationTokenDocument;

            req.user.tokens = req.user.tokens.filter((item: IAuthenticationTokenDocument) => item.authToken !== currentAuthenticationToken.authToken);
            await req.user.save();

            res.response();
        }),
    );

export default router;
