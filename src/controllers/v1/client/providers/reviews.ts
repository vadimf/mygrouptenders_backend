import { Request, Response, Router } from 'express';

import { AppError } from '../../../../models/app-error';
import { AppErrorWithData } from '../../../../models/app-error-with-data';
import { OrderStatus } from '../../../../models/enums';
import { Order } from '../../../../models/order/order';
import { Review } from '../../../../models/review/review';
import asyncMiddleware from '../../../../utilities/async-middleware';

const router = Router();

router
  .route('/')
  /**
   * Get all provider's reviews
   */
  .get(
    asyncMiddleware(async (req: Request, res: Response) => {
      res.response();
    })
  )
  /**
   * Create new review
   */
  .post(
    asyncMiddleware(async (req: Request, res: Response) => {
      const { provider } = req.locals;
      const oldRating = provider.provider.rating;

      const [completedOrder] = await Order.aggregate([
        {
          $match: {
            client: req.user._id,
            status: OrderStatus.Completed
          }
        },
        {
          $lookup: {
            from: 'bids',
            localField: 'approvedBid',
            foreignField: '_id',
            as: 'approvedBid'
          }
        },
        {
          $unwind: '$approvedBid'
        },
        {
          $match: {
            'approvedBid.provider': provider._id
          }
        }
      ]);

      if (!completedOrder) {
        throw AppError.ActionNotAllowed;
      }

      const existingReview = await Review.findOne({
        provider: provider._id,
        client: req.user._id
      });

      if (!!existingReview) {
        throw AppError.ObjectExists;
      }

      const review = new Review({
        ...req.body,
        provider: provider._id,
        client: req.user._id
      });

      const newRating = {
        reviewersAmount: (!!oldRating ? oldRating.reviewersAmount : 0) + 1,
        ratingsSum: (!!oldRating ? oldRating.ratingsSum : 0) + review.rating
      };

      provider.provider.set('rating', newRating);

      try {
        await Promise.all([review.save(), provider.save()]);
      } catch (e) {
        throw new AppErrorWithData(AppError.RequestValidation, e);
      }

      res.response({
        review
      });
    })
  );

export default router;
