import { NextFunction, Request, Response, Router } from 'express';
import { param, query } from 'express-validator/check';
import { sanitizeQuery } from 'express-validator/filter';
import { Types } from 'mongoose';

import { AppError } from '../../../models/app-error';
import { AppErrorWithData } from '../../../models/app-error-with-data';
import {
  Bid,
  bidPopulationForProvider,
  IBidSearchConditions
} from '../../../models/bid/bid';
import { BidSearch } from '../../../models/bid/search';
import { BidStatus, OrderStatus } from '../../../models/enums';
import { Order } from '../../../models/order/order';
import asyncMiddleware, {
  sanitizeQueryToArray,
  validatePageParams
} from '../../../utilities/async-middleware';

const router = Router();

router

  /**
   * Get all provider's bids
   */
  .get(
    '/',
    validatePageParams(),
    [
      sanitizeQueryToArray('status'),
      query('status.*').isIn(Object.values(BidStatus)),
      query('archived')
        .optional()
        .isBoolean(),
      sanitizeQuery('archived').toBoolean()
    ],
    asyncMiddleware(async (req: Request, res: Response) => {
      req.validateRequest();

      const { page, archived, status: statuses } = req.query;
      let conditions: IBidSearchConditions = {
        provider: req.user._id,
        archived: archived === false || archived === true ? archived : false
      };

      if (!!statuses) {
        conditions = {
          ...conditions,
          status: {
            $in: statuses
          }
        };
      }

      const search = new BidSearch(page || 1, conditions);

      res.response({
        bids: await search.getResults(bidPopulationForProvider),
        pagination: await search.getPagination()
      });
    })
  )

  .route('/:id')
  .all(
    [param('id').isMongoId()],
    asyncMiddleware(async (req: Request, res: Response, next: NextFunction) => {
      const bid = (req.locals.bid = await Bid.findById(req.params.id));

      if (!bid) {
        throw AppError.ObjectDoesNotExist;
      }

      if (!(bid.provider as Types.ObjectId).equals(req.user._id)) {
        throw AppError.NotAuthenticated;
      }

      next();
    })
  )

  /**
   * Update bid
   */
  .put(
    asyncMiddleware(async (req: Request, res: Response) => {
      const bid = req.locals.bid;

      delete req.body.status;
      delete req.body.archived;
      delete req.body.prevBids;

      bid.set(req.body);

      try {
        await bid.save();
      } catch (e) {
        throw new AppErrorWithData(AppError.RequestValidation, e);
      }

      res.response({
        bid: await bid.populate(bidPopulationForProvider).execPopulate()
      });
    })
  )

  /**
   * Remove bid
   */
  .delete(
    asyncMiddleware(async (req: Request, res: Response) => {
      const bid = req.locals.bid;
      let orderUpdatePromise: any = Promise.resolve();

      // TODO notifications

      switch (bid.status) {
        case BidStatus.Rejected:
        case BidStatus.Placed:
          bid.status = BidStatus.Removed;

          break;
        case BidStatus.Approved:
          const order = await Order.findById(bid.order);

          switch (order.status) {
            case OrderStatus.InProgress:
              order.status = OrderStatus.Placed;
              order.approvedBid = null;

              orderUpdatePromise = order.save();

              bid.status = BidStatus.TerminatedByProvider;

              break;
            case OrderStatus.Completed:
              bid.archived = true;

              break;
          }

          break;
      }

      await Promise.all([bid.save(), orderUpdatePromise]);

      res.response();
    })
  );

export default router;
