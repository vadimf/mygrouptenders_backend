import { Router } from 'express';

import BidsRouter from './bids';
import OrdersRouter from './orders';

const router = Router();

router.use('/orders', OrdersRouter);
router.use('/bids', BidsRouter);

export default router;
