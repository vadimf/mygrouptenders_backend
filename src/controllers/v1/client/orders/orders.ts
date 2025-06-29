import { NextFunction, Request, Response, Router } from 'express';
import { Types } from 'mongoose';
import multer = require('multer');

import {
  param,
  query
} from '../../../../../node_modules/express-validator/check';
import { sanitizeQuery } from '../../../../../node_modules/express-validator/filter';
import { AppError } from '../../../../models/app-error';
import { AppErrorWithData } from '../../../../models/app-error-with-data';
import { Bid } from '../../../../models/bid/bid';
import { BidStatus, OrderStatus } from '../../../../models/enums';
import { IOrderDocument, Order } from '../../../../models/order/order';
import { OrderSearch } from '../../../../models/order/search';
import asyncMiddleware, {
  sanitizeQueryToArray,
  validatePageParams
} from '../../../../utilities/async-middleware';
import { MimeType } from '../../../../utilities/mime-type';
import {
  IStorageUploadingResults,
  StorageManager
} from '../../../../utilities/storage-manager';
import BidsRouter from './bids';

export const MAX_ORDERS_VIDEOS = 1;

const router = Router();
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 52428800
  }
});

router
  /*
    Query currently logged in user's orders
   */
  .get(
    '/',
    validatePageParams(),
    [
      sanitizeQueryToArray('status'),
      query('status.*').isIn(Object.values(OrderStatus)),
      query('archived')
        .optional()
        .isBoolean(),
      sanitizeQuery('archived').toBoolean()
    ],
    asyncMiddleware(async (req: Request, res: Response) => {
      req.validateRequest();

      const { status: statuses, page, archived } = req.query;

      let conditions: any = {
        client: req.user._id,
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

      const pipelines = [
        {
          $lookup: {
            from: 'bids',
            let: {
              order_id: '$_id'
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$order', '$$order_id'] },
                      { $eq: ['$status', BidStatus.Placed] }
                    ]
                  }
                }
              }
            ],
            as: 'bids'
          }
        },
        {
          $addFields: {
            minBid: {
              $min: '$bids.bid'
            },
            bids: {
              $size: '$bids'
            }
          }
        }
      ];

      const search = new OrderSearch(page || 1, conditions, pipelines);

      res.response({
        orders: await search.aggregateResults(),
        pagination: await search.getPagination()
      });
    })
  )

  /*
    Create new order
   */
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

      res.status(201).response({
        order: await order.populateAll()
      });
    })
  )

  .route('/:id')
  /**
   * Check for order existence
   */
  .all(...checkIfOrderExists())

  /*
    Get order by ID
   */
  .get(
    asyncMiddleware(async (req: Request, res: Response) => {
      const order = req.locals.order;

      res.response({
        order: await order.populateAll()
      });
    })
  )

  /**
   * Check if user is authenticated for interaction
   */
  .all(checkIfUserAuthenticated())

  /*
    Update order by ID
   */
  .put(
    asyncMiddleware(async (req: Request, res: Response) => {
      const body: Partial<IOrderDocument> = req.body;
      const order = req.locals.order;

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

  /*
    Extend expiration date
   */
  .patch(
    asyncMiddleware(async (req: Request, res: Response) => {
      const { expirationDate } = req.body;
      const order = req.locals.order;

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

  /*
    Mark order as removed
   */
  .delete(
    asyncMiddleware(async (req: Request, res: Response) => {
      req.validateRequest();

      const order = req.locals.order;
      let bidsUpdatePromise: any = Promise.resolve();

      // TODO notification

      switch (order.status) {
        case OrderStatus.Placed:
          order.status = OrderStatus.Removed;

          bidsUpdatePromise = Bid.updateMany(
            {
              order: order._id
            },
            {
              status: BidStatus.TerminatedByClient
            }
          );

          break;
        case OrderStatus.InProgress:
          order.status = OrderStatus.TerminatedByClient;

          bidsUpdatePromise = Bid.findByIdAndUpdate(order.approvedBid, {
            status: BidStatus.TerminatedByClient
          });

          break;
        default:
          order.archived = true;

          break;
      }

      await Promise.all([order.save(), bidsUpdatePromise]);

      res.response();
    })
  );

router
  .post(
    '/:id/upload-media',
    ...checkIfOrderExists(),
    upload.array('files', 6),
    asyncMiddleware(async (req: Request, res: Response, next: NextFunction) => {
      const order = req.locals.order;

      const files = req.files as Express.Multer.File[];
      const storageManager = new StorageManager();
      const uploadedFiles: IStorageUploadingResults[] = [];
      let videoAmount = 0;

      for (const file of files) {
        if (file.mimetype.startsWith('video')) {
          if (videoAmount === MAX_ORDERS_VIDEOS) {
            throw new AppErrorWithData(AppError.RequestValidation, {
              message: 'Exceeded video limit'
            });
          }

          videoAmount++;
        }

        const uploadedFile = await storageManager
          .directory('orders/' + order._id)
          .fromBuffer(file.buffer, {
            allowedMimeTypes: [
              MimeType.IMAGE_JPEG,
              MimeType.IMAGE_PNG,
              MimeType.VIDEO_MP4
            ]
          });

        uploadedFiles.push(uploadedFile);
      }

      order.set('media', uploadedFiles);

      await order.save();

      res.response({
        order: await order.populateAll()
      });
    })
  )

  .use(
    '/:id/bids',
    ...checkIfOrderExists(),
    checkIfUserAuthenticated(),
    BidsRouter
  );

function checkIfOrderExists() {
  return [
    [param('id').isMongoId()],
    asyncMiddleware(async (req: Request, res: Response, next: NextFunction) => {
      req.validateRequest();

      const order = (req.locals.order = await Order.findById(req.params.id));

      if (!order) {
        throw AppError.ObjectDoesNotExist;
      }

      next();
    })
  ];
}

function checkIfUserAuthenticated() {
  return asyncMiddleware(
    async (req: Request, res: Response, next: NextFunction) => {
      const order = req.locals.order;

      if (!(order.client as Types.ObjectId).equals(req.user._id)) {
        throw AppError.NotAuthenticated;
      }

      next();
    }
  );
}

export default router;
