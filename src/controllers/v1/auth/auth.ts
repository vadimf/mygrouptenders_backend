import * as express from 'express';
import { body } from 'express-validator/check';

import { isUserAuthenticated } from '../../../config/passport';
import { AppError } from '../../../models/app-error';
import { PhoneConfirmationRequest } from '../../../models/phone-confirmation-request';
import { SystemConfiguration } from '../../../models/system-configuration';
import { IAuthenticationTokenDocument } from '../../../models/user/authentication-token';
import { IPhoneNumberDocument } from '../../../models/user/phone-number';
import { User } from '../../../models/user/user';
import asyncMiddleware, {
  checkPhoneNumberConfirmationRequest,
  getPhoneNumberFromRequest
} from '../../../utilities/async-middleware';
import { Utilities } from '../../../utilities/utilities';

const router = express.Router();

router
  .post(
    '/sign-in',
    ...getPhoneNumberFromRequest(),
    ...checkPhoneNumberConfirmationRequest(),
    asyncMiddleware(async (req: express.Request, res: express.Response) => {
      req.validateRequest();

      const phone: IPhoneNumberDocument = (req as any).phone;

      const user = await User.getSingle({
        'phone.prefix': phone.prefix,
        'phone.number': phone.number
      });

      if (!user) {
        throw AppError.ObjectDoesNotExist;
      }

      if (user.blocked) {
        throw AppError.UserBlocked;
      }

      const token = await user.createAuthToken();

      res.response({
        user: user.selfUser(),
        token: token.authToken
      });
    })
  )

  .post(
    '/send-sms',
    ...getPhoneNumberFromRequest(),
    asyncMiddleware(async (req: express.Request, res: express.Response) => {
      const phoneNumber: IPhoneNumberDocument = (req as any).phone;

      const code =
        process.env.ENV === 'DEV'
          ? '1992'
          : Utilities.randomString(
              SystemConfiguration.validations.confirmationCode.minLength,
              false,
              false,
              false,
              false
            );

      const phoneConfirmationRequests = new PhoneConfirmationRequest({
        phone: phoneNumber,
        code: code
      });

      await phoneConfirmationRequests.save();

      // TODO: SMS: Sending verification code message

      res.response();
    })
  )

  .post(
    '/sign-up',
    ...getPhoneNumberFromRequest(),
    ...checkPhoneNumberConfirmationRequest(),
    [
      body('fullName').custom((input) => {
        if (
          !!input &&
          !SystemConfiguration.validations.fullName.isValid(input)
        ) {
          throw new Error("Fullname doesn't match validation requirements");
        }

        return true;
      })
    ],
    asyncMiddleware(
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
      ) => {
        req.validateRequest();

        const { fullName } = req.body;
        const phone: IPhoneNumberDocument = (req as any).phone;

        let user = await User.getSingle({
          'phone.prefix': phone.prefix,
          'phone.number': phone.number
        });

        if (!!user) {
          throw AppError.ObjectExist;
        }

        user = new User({
          phone,
          profile: {
            fullName
          }
        });

        await user.save();

        const token = await user.createAuthToken();

        res.response({
          user: user.selfUser(),
          token: token.authToken
        });

        next();
      }
    )
  )

  .delete(
    '/',
    isUserAuthenticated(),
    asyncMiddleware(async (req: express.Request, res: express.Response) => {
      const currentAuthenticationToken = req.authToken as IAuthenticationTokenDocument;

      req.user.tokens = req.user.tokens.filter(
        (item: IAuthenticationTokenDocument) =>
          item.authToken !== currentAuthenticationToken.authToken
      );
      await req.user.save();

      res.response();
    })
  );

export default router;
