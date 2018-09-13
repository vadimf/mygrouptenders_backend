import * as express from 'express';
import { SystemConfiguration } from '../../../models/system-configuration';
const router = express.Router();

/**
 * Will return the system configuration variables.
 */
router.get('/', (req: express.Request, res: express.Response) => {
    res.response({
        vars: SystemConfiguration.toJson(),
    });
});

export default router;
