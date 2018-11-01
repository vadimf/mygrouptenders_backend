import { Router } from 'express';

import OrdersRouter from './orders/orders';

const router = Router();

router.use('/orders', OrdersRouter);

export default router;
