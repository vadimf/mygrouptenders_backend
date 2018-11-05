import { Request, Response, Router } from 'express';
import { Types } from 'mongoose';

import { BidSearch } from '../../../../models/bid/search';
import { BidStatus } from '../../../../models/enums';
import { IOrderDocument } from '../../../../models/order/order';
import asyncMiddleware, {
  validatePageParams
} from '../../../../utilities/async-middleware';

const router = Router();

router
  /*
    Get order's bids
  */
  .route('/')

  .get(
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
  );

export default router;
