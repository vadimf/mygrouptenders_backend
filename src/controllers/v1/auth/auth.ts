import * as express from 'express';
import { isUserAuthenticated } from '../../../config/passport';
import { AppError } from '../../../models/app-error';
import { PhoneConfirmationRequest } from '../../../models/phone-confirmation-request';
import { SystemConfiguration } from '../../../models/system-configuration';
import { IAuthenticationTokenDocument } from '../../../models/user/authentication-token';
import { IPhoneNumberDocument, PhoneNumber } from '../../../models/user/phone-number';
import { User } from '../../../models/user/user';
import asyncMiddleware from '../../../utilities/async-middleware';
import { Utilities } from '../../../utilities/utilities';

const router = express.Router();

router
    .post(
        '/sign-in',
        getPhoneNumberFromRequest(),
        asyncMiddleware(async (req: express.Request, res: express.Response) => {
            req.checkBody({
                password: {
                    byValidationObject: {
                        options: SystemConfiguration.validations.password,
                        errorMessage: "Password doesn't match validation requirements",
                    },
                },
            });

            await req.validateRequest();

            const password: string = String(req.body.password || '');
            const phoneNumber: IPhoneNumberDocument = (req as any).phone;

            const user = await User.getSingle({
                'phone.prefix': phoneNumber.prefix,
                'phone.number': phoneNumber.number,
            });

            if ( ! user ) {
                throw AppError.ObjectDoesNotExist;
            }

            if ( user.blocked ) {
                throw AppError.UserBlocked;
            }

            const currentPassword = user.getCurrentPassword();
            if ( ! currentPassword || ! currentPassword.compare(password) ) {
                throw AppError.PasswordDoesNotMatch;
            }

            const token = user.createAuthToken();

            await user.save();

            res.response({
                user: user.selfUser(),
                token: token.authToken,
            });
        }),
    )

    .post(
        '/send-sms',
        getPhoneNumberFromRequest(),
        asyncMiddleware(async (req: express.Request, res: express.Response) => {
            const phoneNumber: IPhoneNumberDocument = (req as any).phone;

            const user = await User.findOne({
                'phone.prefix': phoneNumber.prefix,
                'phone.number': phoneNumber.number,
            });

            if ( user ) {
                throw AppError.ObjectExist;
            }

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
        }),
    )

    .post(
        '/check-code-valid',
        getPhoneNumberFromRequest(),
        checkPhoneNumberConfirmationRequestBeforeSignUp(),
        (req: express.Request, res: express.Response) => {
            res.response();
        },
    )

    .post(
        '/sign-up',
        getPhoneNumberFromRequest(),
        checkPhoneNumberConfirmationRequestBeforeSignUp(),
        asyncMiddleware(async (req: express.Request, res: express.Response) => {
            req.checkBody({
                password: {
                    byValidationObject: {
                        options: SystemConfiguration.validations.password,
                        errorMessage: "Password doesn't match validation requirements",
                    },
                },
            });

            await req.validateRequest();

            const password: string = String(req.body.password || '');
            const phoneNumber: IPhoneNumberDocument = (req as any).phone;

            const user = new User({
                phone: phoneNumber,
            });

            const token = user.createAuthToken();
            user.changePassword(password);

            await user.save();

            PhoneConfirmationRequest
                .deleteMany({
                    'phone.prefix': phoneNumber.prefix,
                    'phone.number': phoneNumber.number,
                })
                .then(() => {})
                .catch(() => {});

            res.response({
                user: user.selfUser(),
                token: token.authToken,
            });
        }),
    )

    .delete(
        '/',
        isUserAuthenticated(),
        asyncMiddleware(async (req: express.Request, res: express.Response) => {
            const currentAuthenticationToken = req.authToken as IAuthenticationTokenDocument;

            req.user.tokens = req.user.tokens.filter((item: IAuthenticationTokenDocument) => item.authToken !== currentAuthenticationToken.authToken);
            await req.user.save();

            res.response();
        }),
    );

export function getPhoneNumberFromRequest() {
    return asyncMiddleware(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        req.checkBody('phone.prefix',         'Phone number prefix missing').notEmpty();
        req.checkBody('phone.number',         'Phone number missing').notEmpty();

        await req.validateRequest();

        (req as any).phone = new PhoneNumber({
            prefix: req.body.phone.prefix,
            number: req.body.phone.number,
        });

        next();
    });
}

function checkPhoneNumberConfirmationRequestBeforeSignUp() {
    return asyncMiddleware(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        req.checkBody({
            code: {
                byValidationObject: {
                    options: SystemConfiguration.validations.confirmationCode,
                    errorMessage: "Password doesn't match validation requirements",
                },
            },
        });

        await req.validateRequest();

        const phoneNumber: IPhoneNumberDocument = (req as any).phone;
        const code = String(req.body.code || '');

        const userExists = await User.count({
            'phone.prefix': phoneNumber.prefix,
            'phone.number': phoneNumber.number,
        });

        if ( userExists ) {
            throw AppError.ObjectExist;
        }

        const phoneConfirmationRequests = await PhoneConfirmationRequest.findOne({
            'phone.prefix': phoneNumber.prefix,
            'phone.number': phoneNumber.number,
            'code': code,
        });

        if ( ! phoneConfirmationRequests ) {
            throw AppError.ObjectDoesNotExist;
        }

        next();
    });
}

export default router;
