import * as express from 'express';
import { AppError } from '../models/app-error';
import { Administrator } from '../models/user/administrator';
import { IAuthenticationTokenDocument } from '../models/user/authentication-token';
import { User } from '../models/user/user';
import asyncMiddleware from '../utilities/async-middleware';

/**
 * Checks if user logged in, and then passes their object into request object. Otherwise - respond with an error.
 *
 * @returns <Promise<(req: e.Request, res: e.Response, next: e.NextFunction) => void>>
 */
export function isUserAuthenticated() {
  return asyncMiddleware(
    async (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      let authToken: string = req.header('x-authorization');

      if (!authToken) {
        authToken = req.query.token;
      }

      if (authToken) {
        req.user = await User.getSingle({ 'tokens.authToken': authToken });

        if (req.user) {
          if (req.user.blocked) {
            throw AppError.UserBlocked;
          }

          req.authToken = req.user.tokens.find(
            (obj: IAuthenticationTokenDocument) => {
              return obj.authToken === authToken;
            }
          ) as IAuthenticationTokenDocument;

          await req.user.save();

          next();
          return true;
        }
      }

      throw AppError.NotAuthenticated;
    }
  );
}
