import { Request, Response, Router } from 'express';
import { query } from 'express-validator/check';

import { sanitizeQuery } from '../../../../node_modules/express-validator/filter';
import { IBidSearchConditions } from '../../../models/bid/bid';
import { BidSearch } from '../../../models/bid/search';
import { BidStatus } from '../../../models/enums';
import asyncMiddleware, {
  sanitizeQueryToArray,
  validatePageParams
} from '../../../utilities/async-middleware';

const router = Router();

router.get(
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
      bids: await search.getResults([
        {
          path: 'order',
          populate: [
            { path: 'client' },
            { path: 'categories', populate: { path: 'parent' } }
          ]
        }
      ]),
      pagination: await search.getPagination()
    });
  })
);

export default router;
