import { eachSeries } from 'async';
import { NextFunction, Request, RequestHandler, Response } from 'express';
import { body, check } from 'express-validator/check';
import { sanitizeBody } from 'express-validator/filter';

import { AppError } from '../models/app-error';
import { PhoneConfirmationRequest } from '../models/phone-confirmation-request';
import { SystemConfiguration } from '../models/system-configuration';
import { IPhoneNumberDocument, PhoneNumber } from '../models/user/phone-number';

export function validatePageParams() {
  return [
    check('page')
      .optional()
      .isNumeric()
      .toInt(),
    check('results_per_page')
      .optional()
      .isNumeric()
      .toInt()
  ];
}

export function sanitizeQueryToArray(queryParam: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const param = req.query[queryParam];

    if (!!param && !Array.isArray(param)) {
      req.query[queryParam] = [param];
    }

    next();
  };
}

export function getPhoneNumberFromRequest() {
  return [
    [
      body('phone.prefix', 'Phone number prefix is missing').exists(),
      body('phone.number', 'Phone number is missing').exists(),
      sanitizeBody('phone.number').customSanitizer((number) => {
        number = number.replace(/\D/g, '');

        if (number.startsWith('0')) {
          number = number.substr(1);
        }

        return number;
      })
    ],
    asyncMiddleware(async (req: Request, res: Response, next: NextFunction) => {
      req.validateRequest();

      req.locals.phone = new PhoneNumber({
        prefix: req.body.phone.prefix,
        number: req.body.phone.number
      });

      next();
    })
  ];
}

export function dynamicMiddlewares(
  middlewares: any[],
  req: Request,
  res: Response,
  next: NextFunction
) {
  eachSeries(
    middlewares,
    function(middleware: RequestHandler | RequestHandler[], doneMiddleware) {
      if (Array.isArray(middleware)) {
        dynamicMiddlewares(middleware, req, res, doneMiddleware);
      } else {
        middleware.call(null, req, res, doneMiddleware);
      }
    },
    function(err) {
      if (err) {
        next(err);
      } else {
        next();
      }
    }
  );
}

export function checkPhoneNumberConfirmationRequest() {
  return [
    [
      body('code', 'Code field is missing')
        .exists()
        .custom((value) => {
          if (
            !!value &&
            !SystemConfiguration.validations.confirmationCode.isValid(value)
          ) {
            throw new Error("Code doesn't match validation requirements");
          }

          return true;
        })
    ],
    asyncMiddleware(async (req: Request, res: Response, next: NextFunction) => {
      req.validateRequest();

      const phoneNumber: IPhoneNumberDocument = req.locals.phone;
      const code = String(req.body.code || '');

      const phoneConfirmationRequests = await PhoneConfirmationRequest.findOne({
        'phone.prefix': phoneNumber.prefix,
        'phone.number': phoneNumber.number,
        code: code
      });

      if (!phoneConfirmationRequests) {
        throw AppError.PhoneConfirmationFailed;
      }

      await PhoneConfirmationRequest.deleteMany({
        'phone.prefix': phoneNumber.prefix,
        'phone.number': phoneNumber.number
      });

      next();
    })
  ];
}

const asyncMiddleware = (
  fn: (req: any, res: any, next: any) => Promise<any>
) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncMiddleware;
