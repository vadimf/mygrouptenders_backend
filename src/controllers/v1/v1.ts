import * as express from 'express';

import { isUserAuthenticated } from '../../config/passport';
import AuthRouter from './auth/auth';
import ClientRouter from './client/client';
import CategoriesRouter from './common/categories';
import LanguagesRouter from './common/languages';
import SystemRouter from './common/system';
import UserRouter from './user/user';

const router = express.Router();

router.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    req.jsonResponseRequested = true;
    next();
});

router.use('/system', SystemRouter);
router.use('/languages', LanguagesRouter);
router.use('/auth', AuthRouter);
router.use('/user', isUserAuthenticated(), UserRouter);
router.use('/client', isUserAuthenticated(), ClientRouter);
router.use('/categories', isUserAuthenticated(), CategoriesRouter);

export default router;
