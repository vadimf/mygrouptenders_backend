import { Request, Response, Router } from 'express';
import { param } from 'express-validator/check';
import { Types } from 'mongoose';

import { AppError } from '../../../../models/app-error';
import { AppErrorWithData } from '../../../../models/app-error-with-data';
import { OrderStatus } from '../../../../models/enums';
import { Order } from '../../../../models/order/order';
import { IReviewSearchParams, Review } from '../../../../models/review/review';
import asyncMiddleware from '../../../../utilities/async-middleware';

const router = Router();

router
  .route('/')
  /**
   * Get all provider's reviews
   */
  .get(
    asyncMiddleware(async (req: Request, res: Response) => {
      const { provider } = req.locals;

      const conditions: IReviewSearchParams = {
        provider: provider._id
      };

      let [results] = await Review.aggregate([
        {
          $match: conditions
        },
        {
          $facet: {
            reviews: [
              {
                $match: {}
              }
            ],
            clientsReview: [
              {
                $match: {
                  client: req.user._id
                }
              },
              {
                $limit: 1
              }
            ],
            orders: [
              {
                $limit: 1
              },
              {
                $lookup: {
                  from: 'orders',
                  let: { client: req.user._id },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $and: [
                            { $eq: ['$client', '$$client'] },
                            { $eq: ['$status', OrderStatus.Completed] }
                          ]
                        }
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
                    },
                    {
                      $count: 'count'
                    }
                  ],
                  as: 'orders'
                }
              },
              {
                $unwind: '$orders'
              },
              {
                $replaceRoot: {
                  newRoot: '$orders'
                }
              }
            ]
          }
        },
        {
          $unwind: {
            path: '$clientsReview',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $unwind: {
            path: '$orders',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $addFields: {
            canLeaveReview: {
              $cond: {
                if: { $gt: ['$orders.count', 0] },
                then: true,
                else: false
              }
            }
          }
        },
        {
          $project: {
            orders: 0
          }
        }
      ]);

      if (!!results) {
        results = {
          ...results,
          reviews: await Review.populate(
            results.reviews.map((review: any) => new Review(review, false)),
            {
              path: 'client'
            }
          )
        };
      } else {
        const [completedOrder] = await getCompletedOrders(
          req.user._id,
          provider._id
        );

        results = {
          reviews: [],
          canLeaveReview: !!completedOrder
        };
      }

      res.response({
        ...results
      });
    })
  )

  /**
   * Create new review
   */
  .post(
    asyncMiddleware(async (req: Request, res: Response) => {
      const { provider } = req.locals;
      const oldRating = provider.provider.rating;

      const [completedOrder] = await getCompletedOrders(
        req.user._id,
        provider._id
      );

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

router.put(
  '/:id',
  [param('id').isMongoId()],
  asyncMiddleware(async (req: Request, res: Response) => {
    req.validateRequest();

    const { provider } = req.locals;
    const oldRating = provider.provider.rating;

    const review = await Review.findById(req.params.id);

    if (!review) {
      throw AppError.ObjectDoesNotExist;
    }

    if (!(review.client as Types.ObjectId).equals(req.user._id)) {
      throw AppError.NotAuthenticated;
    }

    delete req.params.client;
    delete req.params.provider;

    const oldFeedbackRating = review.rating;

    review.set(req.body);

    try {
      await review.validate();
    } catch (e) {
      throw new AppErrorWithData(AppError.RequestValidation, e);
    }

    const newRating = {
      ...provider.provider.rating.toObject(),
      ratingsSum: oldRating.ratingsSum - oldFeedbackRating + review.rating
    };

    provider.provider.set('rating', newRating);

    try {
      await provider.provider.rating.validate();
    } catch (e) {
      throw new AppErrorWithData(AppError.RequestValidation, e);
    }

    await Promise.all([
      review.save({ validateBeforeSave: false }),
      provider.save({ validateBeforeSave: false })
    ]);

    res.response({
      review
    });
  })
);

async function getCompletedOrders(
  clientId: Types.ObjectId,
  providerId: Types.ObjectId
) {
  return await Order.aggregate([
    {
      $match: {
        client: clientId,
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
        'approvedBid.provider': providerId
      }
    }
  ]);
}

export default router;
