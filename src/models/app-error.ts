export enum StatusCode {
    Success = 200,

    Created = 201,
    NoContent = 203,

    BadRequest = 400,
    Unauthorized = 401,
    Forbidden = 403,
    NotFound = 404,
    MethodNotAllowed = 405,
    Conflict = 409,
    Gone = 410,
    UnsupportedMediaType = 415,
    UpgradeRequired = 426,

    InternalServerError = 500,
    NotImplemented = 501,
    ServiceUnavailable = 503,
}

export class AppError {
    constructor(public statusCode: number, public errorCode: number, public errorDescription: string) {}
    public static Success = new AppError(StatusCode.Success, 0, 'Success');

    public static ErrorPerformingAction                     = new AppError(StatusCode.InternalServerError,  100,    'Error performing action');
    public static ObjectDoesNotExist                        = new AppError(StatusCode.NotFound,             200,    "Object doesn't exist");
    public static ObjectExist                               = new AppError(StatusCode.Conflict,             202,    'Object already exist');
    public static NotAuthenticated                          = new AppError(StatusCode.Unauthorized,         300,    'Not authenticated/authorized');
    public static UserBlocked                               = new AppError(StatusCode.Unauthorized,         301,    'User blocked');
    public static RequestValidation                         = new AppError(StatusCode.BadRequest,           500,    'Request validation error');

    public static PasswordDoesNotMatch                      = new AppError(StatusCode.Unauthorized,         3001,   "Password doesn't match");
}
