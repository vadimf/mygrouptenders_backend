import * as express from 'express';
import { body } from 'express-validator/check';

import { isUserAuthenticated } from '../../../config/passport';
import { AppError } from '../../../models/app-error';
import { UserRole } from '../../../models/enums';
import { PhoneConfirmationRequest } from '../../../models/phone-confirmation-request';
import { SystemConfiguration } from '../../../models/system-configuration';
import { IAuthenticationTokenDocument } from '../../../models/user/authentication-token';
import { IPhoneNumberDocument } from '../../../models/user/phone-number';
import { User } from '../../../models/user/user';
import asyncMiddleware, { getPhoneNumberFromRequest } from '../../../utilities/async-middleware';
import { Utilities } from '../../../utilities/utilities';

const router = express.Router();

router
    .post(
        '/sign-in',
        ...checkPhoneNumberConfirmationRequest(),
        asyncMiddleware(async (req: express.Request, res: express.Response) => {

            req.validateRequest();

            const phone: IPhoneNumberDocument = (req as any).phone;

            const user = await User.getSingle({
                'phone.prefix': phone.prefix,
                'phone.number': phone.number,
            });

            if (!user) {
                throw AppError.ObjectDoesNotExist;
            }

            if (user.blocked) {
                throw AppError.UserBlocked;
            }

            const token = user.createAuthToken();

            await user.save();

            await PhoneConfirmationRequest
                .deleteMany({
                    'phone.prefix': phone.prefix,
                    'phone.number': phone.number,
                });

            res.response({
                user: user.selfUser(),
                token: token.authToken,
            });
        }),
    )

    .post(
        '/send-sms',
        ...getPhoneNumberFromRequest(),
        asyncMiddleware(async (req: express.Request, res: express.Response) => {

            const phoneNumber: IPhoneNumberDocument = (req as any).phone;

            const code = process.env.ENV === 'DEV' ? '1992' : Utilities.randomString(
                SystemConfiguration.validations.confirmationCode.minLength,
                false,
                false,
                false,
                false,
            );

            const phoneConfirmationRequests = new PhoneConfirmationRequest({
                phone: phoneNumber,
                code: code,
            });

            await phoneConfirmationRequests.save();

            // TODO: SMS: Sending verification code message

            res.response();
        })
    )

    .post(
        '/sign-up',
        ...checkPhoneNumberConfirmationRequest(),
        [
            body('role', 'Role field is missing')
                .exists()
                .isIn(Object.values(UserRole)).withMessage('Wrong user role is provided'),
            body('fullName', 'Fullname field is missing')
                .exists()
                .custom((input) => {

                    if (!SystemConfiguration.validations.fullName.isValid(input)) {

                        throw new Error("Fullname doesn't match validation requirements");
                    }

                    return true;
                })
        ],
        asyncMiddleware(async (req: express.Request, res: express.Response, next: express.NextFunction) => {

            req.validateRequest();

            const { fullName, role } = req.body;
            const phone: IPhoneNumberDocument = (req as any).phone;

            let user = await User.getSingle({
                'phone.prefix': phone.prefix,
                'phone.number': phone.number,
            });

            if (!!user) {

                throw AppError.ObjectExist;
            }

            user = new User({
                phone,
                role,
                profile: {
                    fullName
                }
            });

            const token = user.createAuthToken();

            await user.save();

            await PhoneConfirmationRequest
                .deleteMany({
                    'phone.prefix': phone.prefix,
                    'phone.number': phone.number,
                });

            res.response({
                user: user.selfUser(),
                token: token.authToken,
            });

            next();
        })
    )

    .delete(
        '/',
        isUserAuthenticated(),
        asyncMiddleware(async (req: express.Request, res: express.Response) => {
            const currentAuthenticationToken = req.authToken as IAuthenticationTokenDocument;

            req.user.tokens = req.user.tokens.filter((item: IAuthenticationTokenDocument) => item.authToken !== currentAuthenticationToken.authToken);
            await req.user.save();

            res.response();
        })
    );

function checkPhoneNumberConfirmationRequest() {
    return [
        ...getPhoneNumberFromRequest(),
        [
            body('code', 'Code field is missing')
                .exists()
                .custom((value) => {

                    if (!SystemConfiguration.validations.confirmationCode.isValid(value)) {

                        throw new Error("Code doesn't match validation requirements");
                    }

                    return true;
                })
        ],
        asyncMiddleware(async (req: express.Request, res: express.Response, next: express.NextFunction) => {

            req.validateRequest();

            const phoneNumber: IPhoneNumberDocument = (req as any).phone;
            const code = String(req.body.code || '');

            const phoneConfirmationRequests = await PhoneConfirmationRequest.findOne({
                'phone.prefix': phoneNumber.prefix,
                'phone.number': phoneNumber.number,
                'code': code,
            });

            if (!phoneConfirmationRequests) {
                throw AppError.PhoneConfirmationFailed;
            }

            next();
        })
    ];
}

export default router;
