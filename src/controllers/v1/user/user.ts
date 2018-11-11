import { NextFunction, Request, Response, Router } from 'express';
import { Types } from 'mongoose';
import multer = require('multer');

import { param } from 'express-validator/check';
import { AppError } from '../../../models/app-error';
import { User } from '../../../models/user/user';
import asyncMiddleware, {
  checkPhoneNumberConfirmationRequest,
  dynamicMiddlewares,
  getPhoneNumberFromRequest
} from '../../../utilities/async-middleware';
import { MimeType } from '../../../utilities/mime-type';
import { StorageManager } from '../../../utilities/storage-manager';

const router = Router();
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 52428800
  }
});

router
  .get('/', respondWithUserObject())

  .put(
    '/',
    asyncMiddleware(async (req: Request, res: Response, next: NextFunction) => {
      let middlewares: any[] = [];

      if (req.body.phone) {
        middlewares = middlewares.concat([
          ...getPhoneNumberFromRequest(),
          function() {
            if (!req.user.phone.compare(req.locals.phone)) {
              dynamicMiddlewares(
                checkPhoneNumberConfirmationRequest(),
                req,
                res,
                next
              );

              return;
            }

            next();
          }
        ]);
      }

      if (!!middlewares.length) {
        dynamicMiddlewares(middlewares, req, res, next);
      } else {
        next();
      }
    }),
    asyncMiddleware(async (req: Request, res: Response) => {
      req.user.set(req.body);

      await req.user.save();

      res.response({
        user: (await req.user.populateAll()).selfUser()
      });
    })
  );

router
  .route('/profile-picture')
  .put(
    upload.single('file'),
    asyncMiddleware(async (req: Request, res: Response, next: NextFunction) => {
      const file = req.file;
      const storageManager = new StorageManager();

      const uploadedFile = await storageManager
        .directory('users/' + req.user._id)
        .fromBuffer(file.buffer, {
          allowedMimeTypes: [MimeType.IMAGE_JPEG, MimeType.IMAGE_PNG]
        });

      req.user.profile.set('picture', uploadedFile);

      next();
    }),
    respondWithUserObject()
  )
  .delete((req: Request, res: Response, next: NextFunction) => {
    if (req.user.profile) {
      req.user.profile.picture = null;
    }

    next();
  }, respondWithUserObject());

router
  .put(
    '/notifications',
    asyncMiddleware(async (req: Request, res: Response) => {
       const receivedToken = req.body.token || '';

       req.authToken.firebaseToken = receivedToken;

       if ( receivedToken ) {
         const conditions = {
             'tokens.firebaseToken': receivedToken,
         };

         const update = {
             $set: {
                 'tokens.$.firebaseToken': '',
             },
         };

         const options = {
             multi: true,
         };

         await User.update(conditions, update, options);
       }

       if ( req.user.isModified() ) {
         req.user.save();
       }

       res.response();
    })
  );

router.get(
  '/:id',
  [param('id').isMongoId()],
  asyncMiddleware(async (req: Request, res: Response) => {
    req.validateRequest();

    const user = await User.getSingle({
      _id: Types.ObjectId(req.params.id),
      blocked: {
        $ne: true
      }
    });

    if (!user) {
      throw AppError.ObjectDoesNotExist;
    }

    res.response({
      user: user
    });
  })
);

function respondWithUserObject() {
  return asyncMiddleware(async (req: Request, res: Response) => {
    if (req.user.isModified()) {
      await req.user.save();
    }

    res.response({
      user: req.user.selfUser()
    });
  });
}

export default router;
