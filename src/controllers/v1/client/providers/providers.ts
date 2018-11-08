import { NextFunction, Request, Response, Router } from 'express';
import { param } from 'express-validator/check';

import { AppError } from '../../../../models/app-error';
import { User } from '../../../../models/user/user';
import asyncMiddleware from '../../../../utilities/async-middleware';
import ReviewsRouter from './reviews';

const router = Router();

router
  /**
   * Check if provider exists
   */
  .use(
    '/:id',
    [param('id').isMongoId()],
    asyncMiddleware(async (req: Request, res: Response, next: NextFunction) => {
      req.validateRequest();

      const provider = (req.locals.provider = await User.findOne({
        _id: req.params.id,
        provider: {
          $exists: true,
          $ne: null
        }
      }));

      if (!provider) {
        throw AppError.ObjectDoesNotExist;
      }

      next();
    })
  )
  /**
   * Reviews routes
   */
  .use('/:id/reviews', ReviewsRouter);

export default router;
