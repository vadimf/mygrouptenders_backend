import { Request, Response, Router } from 'express';
import { query } from 'express-validator/check';

import { Category } from '../../../models/category';
import asyncMiddleware from '../../../utilities/async-middleware';

const router = Router();

router
    .get('/', asyncMiddleware(async (req: Request, res: Response) => {

        const categories = await Category.aggregate([
            {
                $group: {
                    _id: '$parent',
                    children: {
                        $push: '$$CURRENT'
                    }
                }
            }, {
                $lookup: {
                    from: 'categories',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'parentCategory'
                }
            }, {
                $unwind: {
                    path: '$parentCategory'
                }
            }, {
                $project: {
                    _id: 1,
                    title: '$parentCategory.title',
                    displayOrder: '$parentCategory.displayOrder',
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
            categories: categories
        });
    }))

    .get('/search', [
        query('term', 'Term query param is missing')
            .exists()
            .customSanitizer((value) => {

                return !!value ? value.searchToRegex() : null;
            })
    ],
        asyncMiddleware(async (req: Request, res: Response) => {

            req.validateRequest();

            const categories = await Category
                .find({
                    title: {
                        $regex: req.query.term
                    }
                })
                .populate('parent');

            res.response({
                categories: categories
            });

        }));

export default router;
