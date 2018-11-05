import { NextFunction, Request, Response, Router } from 'express';
import { param } from 'express-validator/check';
import { Types } from 'mongoose';

import { AppError } from '../../../../models/app-error';
import { Bid, IBidDocument } from '../../../../models/bid/bid';
import { BidSearch } from '../../../../models/bid/search';
import { BidStatus, OrderStatus } from '../../../../models/enums';
import { IOrderDocument } from '../../../../models/order/order';
import asyncMiddleware, {
  validatePageParams
} from '../../../../utilities/async-middleware';

const router = Router();

router
  /*
    Get order's bids
  */
  .get(
    '/',
    validatePageParams(),
    asyncMiddleware(async (req: Request, res: Response) => {
      req.validateRequest();

      const { page } = req.query;
      const order: IOrderDocument = req.locals.order;

      const conditions = {
        order: Types.ObjectId(order._id),
        status: {
          $ne: BidStatus.Rejected
        }
      };

      const search = new BidSearch(page || 1, conditions);

      res.response({
        bids: await search.getResults(),
        pagination: await search.getPagination()
      });
    })
  )

  .route('/:id')
  /**
   * Check for bid existence
   */
  .all(
    [param('id').isMongoId()],
    asyncMiddleware(async (req: Request, res: Response, next: NextFunction) => {
      req.validateRequest();

      const bid = (req.locals.bid = await Bid.findById(req.params.id));

      if (!bid) {
        throw AppError.ObjectDoesNotExist;
      }

      next();
    })
  )

  /**
   * Accept bid
   */
  .patch(
    asyncMiddleware(async (req: Request, res: Response) => {
      const { order, bid } = req.locals;

      if (order.status !== OrderStatus.Placed) {
        throw AppError.ActionNotAllowed;
      }

      if (!(bid.order as Types.ObjectId).equals(order._id)) {
        throw AppError.ActionNotAllowed;
      }

      bid.status = BidStatus.Approved;

      order.status = OrderStatus.InProgress;
      order.approvedBid = bid._id;

      await Promise.all([bid.save(), order.save()]);

      // TODO send notification

      res.response({
        bid: await bid.populateAll()
      });
    })
  )

  /**
   * Reject bid
   */
  .delete(
    asyncMiddleware(async (req: Request, res: Response) => {
      const { order, bid } = req.locals;

      if (!(bid.order as Types.ObjectId).equals(order._id)) {
        throw AppError.ActionNotAllowed;
      }

      bid.status = BidStatus.Rejected;

      order.status = OrderStatus.Placed;
      order.approvedBid = null;

      await Promise.all([bid.save(), order.save()]);

      // TODO send notification

      res.response();
    })
  );

export default router;
