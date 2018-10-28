import { NextFunction, Request, Response, Router } from 'express';
import { Types } from 'mongoose';

import {
  param,
  query
} from '../../../../../node_modules/express-validator/check';
import { AppError } from '../../../../models/app-error';
import { AppErrorWithData } from '../../../../models/app-error-with-data';
import { OrderStatus } from '../../../../models/enums';
import { Order } from '../../../../models/order/order';
import { OrderSearch } from '../../../../models/order/search';
import asyncMiddleware, {
  validatePageParams
} from '../../../../utilities/async-middleware';

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
    validatePageParams(),
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

      const { status: statuses, page } = req.query;

      let conditions: any = {
        client: req.user._id,
        status: { $not: { $eq: OrderStatus.Removed } }
      };

      if (!!statuses) {
        conditions = {
          ...conditions,
          status: {
            $in: statuses
          }
        };
      }

      const search = new OrderSearch(page || 1, conditions);

      res.response({
        orders: await search.getResults(),
        pagination: await search.getPagination()
      });
    })
  )

  .put(
    '/:id',
    [param('id').isMongoId()],
    asyncMiddleware(async (req: Request, res: Response) => {
      req.validateRequest();

      const order = await Order.findById(req.params.id);

      if (!order) {
        throw AppError.ObjectDoesNotExist;
      }

      delete req.body.status;

      order.set(req.body);

      try {
        await order.validate();
      } catch (e) {
        throw new AppErrorWithData(AppError.RequestValidation, e);
      }

      const updatedOrder = await order.save();

      res.response({
        order: await updatedOrder.populateAll()
      });
    })
  )

  .delete(
    '/:id',
    [param('id').isMongoId()],
    asyncMiddleware(async (req: Request, res: Response) => {
      req.validateRequest();

      const order = await Order.findById(req.params.id);

      if (!order) {
        throw AppError.ObjectDoesNotExist;
      }

      if (!(order.client as Types.ObjectId).equals(req.user._id)) {
        throw AppError.ActionNotAllowed;
      }

      await order.update({ status: OrderStatus.Removed });

      res.response();
    })
  );

export default router;
