import { Router } from 'express';

import OrdersRouter from './orders/orders';
import ProvidersRouter from './providers/providers';

const router = Router();

router.use('/orders', OrdersRouter);
router.use('/providers', ProvidersRouter);

export default router;
