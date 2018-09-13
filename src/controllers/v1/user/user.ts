import * as express from 'express';
import * as mongoose from 'mongoose';
import multer = require('multer');
import { AppError } from '../../../models/app-error';
import { IProfileDocument } from '../../../models/user/profile';
import { User } from '../../../models/user/user';
import asyncMiddleware from '../../../utilities/async-middleware';
import { UploadProfilePicture } from './upload-profile-picture';
import { updateUserProfileByRequest } from './user-update';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 52428800,
    },
});

router
    .get('/', respondWithUserObject())

    .put(
        '/',
        updateUserProfileByRequest(),
        asyncMiddleware(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
            await req.validateRequest();
            next();
        }),
        respondWithUserObject(),
    );

router
    .route('/profile-picture')
    .put(
        upload.single('file'),
        asyncMiddleware(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
            (req.checkBody('file', 'Uploaded file is not an image, file name extension must contain one of the following extensions: .jpg, .jpeg, .png') as any).isImage(req.file);

            await req.validateRequest();

            req.setTimeout(0, null);

            if ( ! req.user.profile ) {
                req.user.profile = {} as IProfileDocument;
            }

            const profilePictureUploader = new UploadProfilePicture(req.user._id.toString());
            profilePictureUploader.buffer = req.file.buffer;

            req.user.profile.picture = await profilePictureUploader.uploadUserProfilePicture();

            next();
        }),
        respondWithUserObject(),
    )
    .delete(
        (req: express.Request, res: express.Response, next: express.NextFunction) => {
            if ( req.user.profile ) {
                req.user.profile.picture = null;
            }

            next();
        },
        respondWithUserObject(),
    );

router
    .put(
        '/profile-picture/base64',
        upload.single('file'),
        asyncMiddleware(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
            // (req.checkBody("file", "Uploaded file is not an image, file name extension must contain one of the following extensions: .jpg, .jpeg, .png") as any).isImage(req.file);
            req.checkBody('file', 'Base64 is invalid').isBase64();

            await req.validateRequest();

            req.setTimeout(0, null);

            if ( ! req.user.profile ) {
                req.user.profile = {} as IProfileDocument;
            }

            const profilePictureUploader = new UploadProfilePicture(req.user._id.toString());
            profilePictureUploader.buffer = Buffer.from(
                String(req.body.file || ''),
                'base64',
            );

            req.user.profile.picture = await profilePictureUploader.uploadUserProfilePicture();

            next();
        }),
        respondWithUserObject(),
    );

router
    .get(
        '/:id',
        asyncMiddleware(async (req: express.Request, res: express.Response) => {
            req.checkParams('id', 'ID is not valid').isMongoId();

            await req.validateRequest();

            const userId = mongoose.Types.ObjectId(req.params.id);
            const user = await User.getSingle({
                _id: userId,
                blocked: {
                    $ne: true,
                },
            });

            if ( ! user ) {
                throw AppError.ObjectDoesNotExist;
            }

            res.response({
                user: user,
            });
        }),
    );

function respondWithUserObject() {
    return asyncMiddleware(async (req: express.Request, res: express.Response) => {
        if ( req.user.isModified() ) {
            await req.user.save();
        }

        res.response({
            user: req.user.selfUser(),
        });
    });
}

export default router;
