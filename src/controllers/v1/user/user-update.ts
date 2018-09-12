import * as express from "express";
import { SystemConfiguration } from "../../../models/system-configuration";
import { IProfileDocument } from "../../../models/user/profile";

import { AsyncMiddleware } from "../../../server";

export function updateUserProfileByRequest() {
    return AsyncMiddleware(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        req.checkBody({
            "user.profile.firstName": {
                byValidationObject: {
                    options: SystemConfiguration.validations.firstName,
                    errorMessage: "Last name doesn't match validation requirements",
                },
            },
            "user.profile.lastName": {
                byValidationObject: {
                    options: SystemConfiguration.validations.lastName,
                    errorMessage: "First name doesn't match validation requirements",
                },
            },
        });

        if ( ! req.user.profile ) {
            req.user.profile = {} as IProfileDocument;
        }

        req.user.profile.firstName = String(req.body.user.profile.firstName || "");
        req.user.profile.lastName = String(req.body.user.profile.lastName || "");

        next();
    });
}
