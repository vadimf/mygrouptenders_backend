import * as express from 'express';

import { IProfileDocument } from '../../../models/user/profile';
import asyncMiddleware from '../../../utilities/async-middleware';

export function updateUserProfileByRequest() {
    return [
        asyncMiddleware(async (req: express.Request, res: express.Response, next: express.NextFunction) => {

            if (!req.user.profile) {
                req.user.profile = {} as IProfileDocument;
            }

            req.user.profile.firstName = String(req.body.user.profile.firstName || '');
            req.user.profile.lastName = String(req.body.user.profile.lastName || '');

            next();
        })
    ];
}
