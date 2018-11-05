import { Request, Response, Router } from 'express';
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
   * Accept bid
   */
  .patch(
    [param('id').isMongoId()],
    asyncMiddleware(async (req: Request, res: Response) => {
      req.validateRequest();

      const { order } = req.locals;

      if (order.status !== OrderStatus.Placed) {
        throw AppError.ActionNotAllowed;
      }

      const bid: IBidDocument = await Bid.findById(req.params.id);

      if (!bid) {
        throw AppError.ObjectDoesNotExist;
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
  );

export default router;
