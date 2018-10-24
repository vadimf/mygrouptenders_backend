import { Request, Response, Router } from 'express';

import { AppError } from '../../../../models/app-error';
import { AppErrorWithData } from '../../../../models/app-error-with-data';
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
    asyncMiddleware(async (req: Request, res: Response) => {
      res.response({
        orders: await Order.get({ client: req.user._id })
      });
    })
  );

export default router;
