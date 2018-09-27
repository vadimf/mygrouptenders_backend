import { Request, Response, Router } from 'express';

import { Area } from '../../../models/area';
import asyncMiddleware from '../../../utilities/async-middleware';

const router = Router();

router.get('/', asyncMiddleware(async (req: Request, res: Response) => {

    const areas = await Area.aggregate([
        {
            $group: {
                _id: '$parent',
                children: {
                    $push: '$$CURRENT'
                }
            }
        }, {
            $lookup: {
                from: 'areas',
                localField: '_id',
                foreignField: '_id',
                as: 'parentArea'
            }
        }, {
            $unwind: {
                path: '$parentArea'
            }
        }, {
            $project: {
                _id: 1,
                title: '$parentArea.title',
                displayOrder: '$parentArea.displayOrder',
                children: '$children'
            }
        }, {
            $project: {
                children: {
                    parent: 0,
                    __v: 0
                }
            }
        }
    ]);

    res.response({
        areas: areas
    });
}));

export default router;
