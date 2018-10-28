import * as express from 'express';
import { body, check } from 'express-validator/check';
import { sanitizeBody } from 'express-validator/filter';

import { PhoneNumber } from '../models/user/phone-number';

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
    asyncMiddleware(
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
      ) => {
        req.validateRequest();

        (req as any).phone = new PhoneNumber({
          prefix: req.body.phone.prefix,
          number: req.body.phone.number
        });

        next();
      }
    )
  ];
}

const asyncMiddleware = (
  fn: (req: any, res: any, next: any) => Promise<any>
) => (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncMiddleware;
