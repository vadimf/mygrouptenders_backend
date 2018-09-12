import * as express from "express";
import * as mongoose from "mongoose";
import * as multer from "multer";
import { AppError } from "../../../../models/app-error";
import { IFileDocument } from "../../../../models/file";
import { Pagination } from "../../../../models/pagination";
import { SystemConfiguration } from "../../../../models/system-configuration";
import { IProfileDocument } from "../../../../models/user/profile";
import { IUserDocument, User } from "../../../../models/user/user";
import { AsyncMiddleware } from "../../../../server";
import { UploadProfilePicture } from "../../user/upload-profile-picture";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 52428800,
    },
});

router
    .get(
        "/",
        AsyncMiddleware(async (req: express.Request, res: express.Response) => {
            const page = Number(req.query.page || 1);
            const resultsPerPage = Number(req.query.results_per_page || 25);
            const search = String(req.query.search || "");

            const conditions: any = {};

            if ( search ) {
                conditions.$or = [
                    {
                        "profile.fullNames": search.toLowerCase().searchToRegex(),
                    },
                    {
                        email: search.toLowerCase().searchToRegex(false),
                    },
                ];

                let formattedPhoneNumber = search.replace(/[^0-9]/g, "");
                formattedPhoneNumber = formattedPhoneNumber.startsWith("0") ? formattedPhoneNumber.substr(1) : formattedPhoneNumber;

                if ( formattedPhoneNumber ) {
                    conditions.$or.push(
                        {
                            "phone.number": formattedPhoneNumber.searchToRegex(),
                        },
                    );
                }
            }

            const totalUsers = await User.count(conditions);
            const pagination = new Pagination(page, totalUsers, resultsPerPage);

            let userQuery = User
                .get(conditions)
                .sort("-createdAt");

            if ( ! pagination.disabled ) {
                userQuery = userQuery
                    .skip(pagination.offset)
                    .limit(pagination.resultsPerPage);
            }

            const users: IUserDocument[] = await userQuery;

            res.response({
                users: users.map((user: IUserDocument) => user.toAdministrator()),
                pagination: pagination,
            });
        }),
    );

router
    .route("/:id")

    .get(
        getUserByParams(),
        returnUser(),
    )

    .put(
        getUserByParams(),
        AsyncMiddleware(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
            req.checkBody({
                "user.profile.firstName": {
                    byValidationObject: {
                        options: SystemConfiguration.validations.firstName,
                        errorMessage: "Last name doesn't match validation requirements",
                    },
                },
                "user.profile.lastName": {
                    byValidationObject: {
                        options: SystemConfiguration.validations.lastName,
                        errorMessage: "First name doesn't match validation requirements",
                    },
                },
            });

            if ( req.body.user.email ) {
                req.checkBody({
                    "user.email": {
                        isEmail: {
                            errorMessage: "Email invalid",
                        },
                    },
                });
            }

            await req.validateRequest();

            const user: IUserDocument = (req as any).requestedUser;

            if ( ! user.profile ) {
                user.profile = {} as IProfileDocument;
            }

            user.profile.firstName = String(req.body.user.profile.firstName || "");
            user.profile.lastName = String(req.body.user.profile.lastName || "");
            user.email = String(req.body.user.email || "").toLowerCase();

            next();
        }),
        returnUser(),
    );

router
    .route("/:id/picture")

    .put(
        getUserByParams(),
        upload.single("file"),
        AsyncMiddleware(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
            req.checkBody("file", "Base64 is invalid").isBase64();

            await req.validateRequest();

            const user: IUserDocument = (req as any).requestedUser;

            req.setTimeout(0, null);

            if ( ! user.profile ) {
                user.profile = {} as IProfileDocument;
            }

            const profilePictureUploader = new UploadProfilePicture(user._id.toString());
            profilePictureUploader.buffer = Buffer.from(
                String(req.body.file || ""),
                "base64",
            );

            user.profile.picture = (await profilePictureUploader.uploadUserProfilePicture() as IFileDocument);

            next();
        }),
        returnUser(),
    )

    .delete(
        getUserByParams(),
        AsyncMiddleware(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
            const user: IUserDocument = (req as any).requestedUser;

            if ( ! user.profile ) {
                user.profile = {} as IProfileDocument;
            }

            user.profile.picture = null;

            next();
        }),
        returnUser(),
    );

router
    .put(
        "/:id/password",
        getUserByParams(),
        AsyncMiddleware(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
            req.checkBody({
                password: {
                    byValidationObject: {
                        options: SystemConfiguration.validations.password,
                        errorMessage: "Password doesn't match validation requirements",
                    },
                },
            });

            await req.validateRequest();

            const user: IUserDocument = (req as any).requestedUser;

            user.changePassword(String(req.body.password));

            next();
        }),
        returnUser(),
    );

router
    .route("/:id/block")

    .post(
        getUserByParams(),
        AsyncMiddleware(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
            const user: IUserDocument = (req as any).requestedUser;

            user.block(true);

            next();
        }),
        returnUser(),
    )

    .delete(
        getUserByParams(),
        AsyncMiddleware(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
            const user: IUserDocument = (req as any).requestedUser;

            user.block(false);

            next();
        }),
        returnUser(),
    );

function getUserByParams() {
    return AsyncMiddleware(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        req.checkParams("id", "ID is not valid").isMongoId();

        await req.validateRequest();

        const userId = mongoose.Types.ObjectId(String(req.params.id || ""));

        (req as any).requestedUser = await User.getSingle({
            _id: userId,
        });

        if ( ! (req as any).requestedUser ) {
            throw AppError.ObjectDoesNotExist;
        }

        next();
    });
}

function returnUser() {
    return AsyncMiddleware(async (req: express.Request, res: express.Response) => {
        const user: IUserDocument = (req as any).requestedUser;

        if ( user.isModified() ) {
            await user.save();
        }

        res.response({
            user: user.toAdministrator(),
        });
    });
}

export default router;
