import { IOrderDocument } from '../models/order/order';
import { IAuthenticationTokenDocument } from '../models/user/authentication-token';
import { IPhoneNumberDocument } from '../models/user/phone-number';
import { IUserDocument } from '../models/user/user';

declare global {
  // tslint:disable-next-line:no-namespace
  namespace Express {
    // tslint:disable-next-line:interface-name
    export interface Request {
      validateRequest(): void;
      user?: IUserDocument;
      authToken?: IAuthenticationTokenDocument;
      locals: {
        phone?: IPhoneNumberDocument;
        order?: IOrderDocument;
      };
      mobileDevice(): boolean;
    }

    // tslint:disable-next-line:interface-name
    interface Response {
      error: (e: any, meta?: any) => Response | void;
      response: (data?: any) => Response;
    }

    // tslint:disable-next-line:interface-name
    export interface Request {
      jsonResponseRequested?: boolean;
    }
  }
}
