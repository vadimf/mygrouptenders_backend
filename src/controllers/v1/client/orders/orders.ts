import { NextFunction, Request, Response, Router } from 'express';

import { query } from '../../../../../node_modules/express-validator/check';
import { AppError } from '../../../../models/app-error';
import { AppErrorWithData } from '../../../../models/app-error-with-data';
import { OrderStatus } from '../../../../models/enums';
import { Order } from '../../../../models/order/order';
import asyncMiddleware from '../../../../utilities/async-middleware';

const router = Router();

router
  .post(
    '/',
    asyncMiddleware(async (req: Request, res: Response) => {
      const order = new Order({
        client: req.user._id,
        ...req.body
      });

      try {
        await order.validate();
      } catch (e) {
        throw new AppErrorWithData(AppError.RequestValidation, e);
      }

      const orderDocument = await order.save();

      res.response({
        order: await orderDocument.populateAll()
      });
    })
  )

  .get(
    '/',
    [
      (req: Request, res: Response, next: NextFunction) => {
        const status = req.query.statuses;

        if (!!status && !Array.isArray(status)) {
          req.query.statuses = [status];
        }

        next();
      },
      query('status.*').isIn(Object.values(OrderStatus))
    ],
    asyncMiddleware(async (req: Request, res: Response) => {
      req.validateRequest();

      const { status } = req.query;
      let conditions: any = {
        client: req.user._id
      };

      if (!!status) {
        conditions = {
          ...conditions,
          status: { $in: status }
        };
      }

      res.response({
        orders: await Order.get(conditions)
      });
    })
  );

export default router;
