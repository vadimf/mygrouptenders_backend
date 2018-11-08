import { Request, Response, Router } from 'express';

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
      res.response();
    })
  );

export default router;
