// tslint:disable-next-line:no-namespace
declare namespace Express {
  // tslint:disable-next-line:interface-name
  export interface Request {
    validateRequest(): void;
    user?: any;
    authToken?: any;
    phone?: any;
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
