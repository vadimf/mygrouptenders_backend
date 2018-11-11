import { INotificationDocument } from '../models/notification/notification';
import { IAuthenticationTokenDocument } from '../models/user/authentication-token';
import { User } from '../models/user/user';
import { firebaseClient } from './firebase-client';

/**
 * Push notification submission builder
 */
export class NotificationSender<T> {
  protected _tokens: IAuthenticationTokenDocument[];
  protected _title: string = '';
  protected _type: number = 0;
  protected _message: string = '';
  protected _payload: any = {};

  /**
   * NotificationSender Constructor
   * Receive token (or multiple tokens)
   *
   * @param {string | string[]} tokens
   */
  constructor(
    tokens: IAuthenticationTokenDocument | IAuthenticationTokenDocument[],
    private _notifications: INotificationDocument[]
  ) {
    this._tokens = tokens instanceof Array ? tokens : [tokens];
  }

  /**
   * Set the title of the push notification
   * @param {string} title
   * @returns {this}
   */
  public title(title: string): this {
    this._title = title;

    this._notifications.forEach((notification) => {
      notification.set('data', {
        ...notification.data,
        title
      });
    });

    return this;
  }

  /**
   * Set the type of the push notification
   *
   * @param {number} type
   * @returns {this}
   */
  public type(type: number): this {
    this._type = type;

    this._notifications.forEach((notification) => {
      notification.set('type', type);
    });

    return this;
  }

  /**
   * Set the message (content) of the push notification
   *
   * @param {string} text
   * @returns {this}
   */
  public message(text: string): this {
    this._message = text;

    this._notifications.forEach((notification) => {
      notification.set('data', {
        ...notification.data,
        message: text
      });
    });

    return this;
  }

  /**
   * Add additional payload (data) into the push notification, to be received by clients
   *
   * @param payload
   * @returns {this}
   */
  public additionalPayload(payload: T): this {
    this._payload = Object.assign(this._payload, payload);

    this._notifications.forEach((notification) => {
      notification.set('data', Object.assign(notification.data, payload));
    });

    return this;
  }

  /**
   * Prepare the payload for FCM
   *
   * @returns <{data: {title: string; message: string; type: string} & any}>
   * @private
   */
  private _generatePayload() {
    return {
      data: Object.assign(
        {
          title: this._title,
          message: this._message,
          type: '' + this._type
        },
        this._payload
      )
    };
  }

  /**
   * Send push notification(s)
   *
   * @returns Promise<any> | Promise
   */
  public send() {
    let promise: Promise<any> = Promise.resolve();

    const tokens = this._tokens
      .map((item: IAuthenticationTokenDocument) => item.firebaseToken)
      .unique();

    if (tokens.length) {
      promise = this._sendNotifications(tokens, this._generatePayload());
    }

    return promise;
  }

  /**
   * ***Actually*** send the push notification(s)
   *
   * @param {string[]} tokens
   * @param payload
   * @returns {Promise<any>}
   * @private
   */
  private _sendNotifications(tokens: string[], payload: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!tokens) {
        return reject('No tokens');
      }

      firebaseClient()
        .messaging()
        .sendToDevice(tokens, payload, {
          priority: 'high',
          contentAvailable: true
        })
        .then(async (response: any) => {
          // TODO save succesful response to Notification objects

          if (response.results) {
            const removeTokens: string[] = [];
            const resultsWithIndexes = response.results.map(
              (result: any, index: number) => ({ result, index })
            );

            for (const { result, index } of resultsWithIndexes) {
              if (
                result.error &&
                result.error.code ===
                  'messaging/registration-token-not-registered'
              ) {
                removeTokens.push(tokens[index]);
              }
            }

            if (removeTokens.length > 0) {
              const conditions = {
                'tokens.firebaseToken': { $in: removeTokens }
              };

              const update = {
                $set: {
                  'tokens.$.firebaseToken': ''
                }
              };

              const options = {
                multi: true
              };

              await User.update(conditions, update, options);
            }
          }

          resolve(response);
        })
        .catch(async (error: any) => {
          await Promise.all(
            this._notifications.map(async (notification) => {
              notification.set('error', error);

              return notification.save();
            })
          );

          reject(error);
        });
    });
  }
}
