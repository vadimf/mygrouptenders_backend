import * as express from 'express';

export default (fn: (req: any, res: any, next: any) => Promise<any>) =>
    (req: express.Request, res: express.Response, next: express.NextFunction) => {
        Promise.resolve(fn(req, res, next))
            .catch(next);
    };
