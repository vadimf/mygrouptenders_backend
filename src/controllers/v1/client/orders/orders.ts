import { NextFunction, Request, Response, Router } from 'express';
import { Types } from 'mongoose';

import {
  body as checkBody,
  param,
  query
} from '../../../../../node_modules/express-validator/check';
import { AppError } from '../../../../models/app-error';
import { AppErrorWithData } from '../../../../models/app-error-with-data';
import { OrderStatus } from '../../../../models/enums';
import { IOrderDocument, Order } from '../../../../models/order/order';
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
        await order.save();
      } catch (e) {
        throw new AppErrorWithData(AppError.RequestValidation, e);
      }

      res.response({
        order: await order.populateAll()
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

  .get(
    '/:id',
    [param('id').isMongoId()],
    asyncMiddleware(async (req: Request, res: Response) => {
      req.validateRequest();

      const order = await Order.findById(req.params.id);

      if (!order) {
        throw AppError.ObjectDoesNotExist;
      }

      res.response({
        order: await order.populateAll()
      });
    })
  )

  .put(
    '/:id',
    [param('id').isMongoId()],
    asyncMiddleware(async (req: Request, res: Response) => {
      req.validateRequest();

      const body: Partial<IOrderDocument> = req.body;
      const order = await Order.findById(req.params.id);

      if (!order) {
        throw AppError.ObjectDoesNotExist;
      }

      if (!(order.client as Types.ObjectId).equals(req.user._id)) {
        throw AppError.ActionNotAllowed;
      }

      delete body.status;
      delete body.expirationDate;

      order.set(body);

      try {
        await order.save();
      } catch (e) {
        throw new AppErrorWithData(AppError.RequestValidation, e);
      }

      res.response({
        order: await order.populateAll()
      });
    })
  )

  .patch(
    '/:id',
    [param('id').isMongoId()],
    asyncMiddleware(async (req: Request, res: Response) => {
      req.validateRequest();

      const { expirationDate } = req.body;
      const order = await Order.findById(req.params.id);

      if (!order) {
        throw AppError.ObjectDoesNotExist;
      }

      if (!(order.client as Types.ObjectId).equals(req.user._id)) {
        throw AppError.ActionNotAllowed;
      }

      order.set({ expirationDate });

      try {
        await order.save();
      } catch (e) {
        throw new AppErrorWithData(AppError.RequestValidation, e);
      }

      res.response({
        order: await order.populateAll()
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

      if (order.status === OrderStatus.InProgress) {
        // TODO send notification to provider
      }

      await order.update({ status: OrderStatus.Removed });

      res.response();
    })
  );

export default router;
