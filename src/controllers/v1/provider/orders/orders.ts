import { Request, Response, Router } from 'express';
import { param } from 'express-validator/check';

import { AppError } from '../../../../models/app-error';
import { AppErrorWithData } from '../../../../models/app-error-with-data';
import { Bid } from '../../../../models/bid';
import { Order } from '../../../../models/order/order';
import asyncMiddleware from '../../../../utilities/async-middleware';

const router = Router();

router.post(
  '/:id/bid',
  [param('id').isMongoId()],
  asyncMiddleware(async (req: Request, res: Response) => {
    req.validateRequest();

    const order = await Order.findById(req.params.id);

    if (!order) {
      throw AppError.ObjectDoesNotExist;
    }

    const bid = new Bid({
      order: order._id,
      provider: req.user._id,
      bid: req.body.bid,
      comment: req.body.comment
    });

    try {
      await bid.save();
    } catch (e) {
      throw new AppErrorWithData(AppError.RequestValidation, e);
    }

    res.response({
      bid: await bid.populateAll()
    });
  })
);

export default router;
