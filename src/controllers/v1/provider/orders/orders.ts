import { Request, Response, Router } from 'express';
import { body, param } from 'express-validator/check';
import { Types } from 'mongoose';

import { AppError } from '../../../../models/app-error';
import { AppErrorWithData } from '../../../../models/app-error-with-data';
import { IAreaDocument } from '../../../../models/area';
import { Bid } from '../../../../models/bid/bid';
import { ICategoryDocument } from '../../../../models/category';
import { IOrderSearchConditions, Order } from '../../../../models/order/order';
import { OrderSearch } from '../../../../models/order/search';
import asyncMiddleware, {
  validatePageParams
} from '../../../../utilities/async-middleware';

const router = Router();

router

  /**
   * Query orders
   */
  .post(
    '/search',
    validatePageParams(),
    [
      body('categories')
        .optional()
        .isArray(),
      body('categories.*').isMongoId(),
      body('areas')
        .optional()
        .isArray(),
      body('areas.*').isMongoId()
    ],
    asyncMiddleware(async (req: Request, res: Response) => {
      req.validateRequest();

      const { page } = req.query;
      const {
        categories: savedCategories,
        areas: savedAreas
      } = req.user.provider;
      const { categories: filterCategories, areas: filterAreas } = req.body;

      const conditions: IOrderSearchConditions = {
        client: {
          $ne: req.user._id
        },
        categories: {
          $in:
            !!filterCategories && !!filterCategories.length
              ? filterCategories.map((category: string) =>
                  Types.ObjectId(category)
                )
              : (savedCategories as ICategoryDocument[]).map(
                  (category) => category._id
                )
        },
        'address.area': {
          $in:
            !!filterAreas && !!filterAreas.length
              ? filterAreas.map((area: string) => Types.ObjectId(area))
              : (savedAreas as IAreaDocument[]).map((area) => area._id)
        }
      };

      const search = new OrderSearch(page || 1, conditions);

      res.response({
        orders: await search.getResults(),
        pagination: await search.getPagination()
      });
    })
  )

  .post(
    '/:id/bid',
    [param('id').isMongoId()],
    asyncMiddleware(async (req: Request, res: Response) => {
      req.validateRequest();

      const order = await Order.findById(req.params.id);

      if (!order) {
        throw AppError.ObjectDoesNotExist;
      }

      if ((order.client as Types.ObjectId).equals(req.user._id)) {
        throw AppError.ActionNotAllowed;
      }

      const existingBid = await Bid.findOne({
        order: order._id,
        provider: req.user._id
      });

      if (!!existingBid) {
        throw AppError.ObjectExists;
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

      res.status(201).response({
        bid: await bid.populateAll()
      });
    })
  );

export default router;
