import * as express from 'express';

import { isProvider, isUserAuthenticated } from '../../config/passport';
import AuthRouter from './auth/auth';
import ClientRouter from './client/client';
import AreasRouter from './common/areas';
import CategoriesRouter from './common/categories';
import LanguagesRouter from './common/languages';
import SystemRouter from './common/system';
import ProviderRouter from './provider/provider';
import UserRouter from './user/user';

const router = express.Router();

router.use(
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    req.jsonResponseRequested = true;
    next();
  }
);

router.use('/system', SystemRouter);
router.use('/languages', LanguagesRouter);
router.use('/auth', AuthRouter);
router.use('/user', isUserAuthenticated(), UserRouter);
router.use('/client', isUserAuthenticated(), ClientRouter);
router.use('/provider', isUserAuthenticated(), isProvider(), ProviderRouter);
router.use('/categories', isUserAuthenticated(), CategoriesRouter);
router.use('/areas', isUserAuthenticated(), AreasRouter);

export default router;
