import bluebird = require("bluebird");
import * as bodyParser from "body-parser";
import * as compression from "compression";
import * as dotenv from "dotenv";
import errorHandler = require("errorhandler");
import * as express from "express";
import expressValidator = require("express-validator");
import * as helmet from "helmet";
import * as i18n from "i18n";
import * as moment from "moment";
import * as mongoose from "mongoose";
import * as logger from "morgan";
import * as nodeCron from "node-cron";
import * as path from "path";
import { AppErrorWithData } from "./models/app-error-with-data";
import { ISystemVariablesDocument, SystemVariables } from "./models/system-variables";
import { Validation } from "./models/validation";
import { Utilities } from "./utilities/utilities";

// Load environment variables from .env file, where API keys and passwords are configured.
dotenv.config({ path: "config/.env" });

// API keys and Passport configuration.
import { AppError } from "./models/app-error";

// Create Express server.
export const app = express();

// Connect to MongoDB.
const mongoDbUri = (process.env.MONGODB_URI || process.env.MONGOLAB_URI);

mongoose.connect(
    mongoDbUri,
    {
        useMongoClient: true,
        promiseLibrary: bluebird,
    },
    (err: any) => {
        if ( err ) {
            console.log("MongoDB connection error. Please make sure MongoDB is running.", mongoDbUri);
            process.exit();
        }
    },
);
(mongoose as any).Promise = bluebird;

// Express configuration.
app.set("port", process.env.PORT || 3000);
app.set("env", process.env.ENV || "development");
app.set("view engine", "pug");
app.set("name", process.env.APP_NAME || "Project");
app.set("root dir", __dirname + "/../");
app.use(helmet());
app.use(compression({
    threshold: 1,
}));
app.use(logger("dev"));
app.use(bodyParser.json({limit: "50mb"}));
app.use(bodyParser.urlencoded({
    extended: false,
}));

// Error Handler
if ( process.env.ENV === "DEV" ) {
    app.use(errorHandler());
}

app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    if ( req.method === "POST" && req.body._method ) {
        req.method = req.body._method;
    }

    next();
});

app.use(expressValidator({
    customValidators: {
        inEnum: (input: string|number, options: any) => input in options,
        isIsraeliIdNumber: (input: string) => input && Utilities.isIsraeliIdNumberValid(input),
        between: (input: number, options: {min: number, max?: number}) => Number(input).between(options.min, options.max),
        isArrayLength: (input: any[], options: {min: number, max?: number}) => {
            const length = input ? input.length : 0;
            return length.between(
                options.min || 0,
                options.max || null,
            );
        },
        byValidationObject: (input: string, validation: Validation) => input && validation.isValid(input),
        isImage: (value, file: {originalname: string}) => {
            if ( ! file || ! file.originalname ) {
                return false;
            }
            const extension = (path.extname(file.originalname)).toLowerCase();
            switch (extension) {
                case ".jpg":
                case ".jpeg":
                case ".png":
                    return true;
                default:
                    return false;
            }
        },
    },
}));

app.use((req, res, next) => {
    res.locals.user = req.user;
    next();
});

i18n.configure({
    locales: ["en", "he"],
    directory: __dirname + "/../locales",
    objectNotation: true,
});
app.use(i18n.init);

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, X-Authorization, X-Language, X-Mobile-Device");
    next();
});

app.use((req, res, next) => {
    let language: string = req.header("x-language");

    if ( ! language ) {
        language = req.query.language;

        if ( ! language ) {
            language = "he";
        }
    }

    app.set("language", language);

    req.setLocale(language);
    i18n.setLocale(language);
    i18n.setLocale(req, language);
    moment.locale(language);

    next();
});

app.use(express.static(path.join(__dirname, "public"), { maxAge: 31557600000 }));
app.use((req, res, next) => {
    const contentType = req.header("content-type");
    req.jsonResponseRequested = contentType &&
        ( contentType.indexOf("application/json") >= 0 || contentType.indexOf("multipart/form-data") >= 0 );

    res.error = (e: any, meta?: any) => {
        if ( req.method === "OPTIONS" ) {
            return res.response();
        }

        const jsonResponse = req.jsonResponseRequested;

        let error: AppError;
        let message: string = "";

        if (e instanceof AppError) {
            error = e;
            message = e.errorDescription;
        }
        else if ( e instanceof AppErrorWithData ) {
            error = e.error;
            message = e.error.errorDescription;
            meta = e.data;
        }
        else {
            error = AppError.ErrorPerformingAction;

            message = e.message ? e.message : "General error";

            if ( ! meta ) {
                meta = e;
            }
        }

        console.log("System exception", {
            error: e,
            query: req.query,
            params: req.params,
            body: req.body,
            headers: req.headers,
        });

        if (jsonResponse) {
            return res.status(error.statusCode).json({
                errorCode: error.errorCode,
                errorDescription: error.errorDescription,
                meta: meta && meta.message && meta.message ? {
                    exceptionMessage: meta.message,
                } : meta,
            });
        }
        else {
            return res.render("fatal", {
                brand: process.env.APP_NAME,
                title: "Error",
                message,
            });
        }
    };

    res.response = (data?: any) => {
        return res.status(200).json(Object.assign({
            errorCode: AppError.Success.errorCode,
            errorDescription: AppError.Success.errorDescription,
        }, data));
    };

    req.validateRequest = async (): Promise<void> => {
        const validationResults = await req.getValidationResult();

        if ( validationResults.array().length ) {
            throw new AppErrorWithData(AppError.RequestValidation, validationResults.array());
        }

        return;
    };

    req.mobileDevice = (): boolean => {
        return req.header("x-mobile-device") === "1";
    };

    next();
});

export const AsyncMiddleware = (fn: (req: any, res: any, next: any) => Promise<any>) =>
    (req: express.Request, res: express.Response, next: express.NextFunction) => {
        Promise.resolve(fn(req, res, next))
            .catch(next);
    };

// Controllers (route handlers)
import { default as V1Router } from "./controllers/v1/v1";

// Primary app routes.
app.use("/v1", V1Router);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if ( err ) {
        res.error(err);
    }

    doNothing(next);
});

function doNothing(a: any) { a.toString(); }

// Start Express server.
app.listen(app.get("port"), () => {
    console.log(("App '%s' is running at http://localhost:%d in %s mode"), app.get("name"), app.get("port"), app.get("env"));
    console.log("Press CTRL-C to stop\n");

    SystemVariables
        .findOne()
        .then(async (variables: ISystemVariablesDocument) => {
            if ( ! variables ) {
                variables = new SystemVariables({
                    contactInformation: {
                        info: "info@globalbit.co.il",
                        support: "support@globalbit.co.il",
                    },
                } as ISystemVariablesDocument);

                await variables.save();
            }

            app.set("system", variables);

            console.log("System configuration initiated");
        })
        .catch(() => {});


    // Cron tasks:

    // nodeCron.schedule("0 0 * * * *", async () => {
    // });
});

module.exports = app;
