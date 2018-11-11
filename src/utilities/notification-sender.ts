import { NotificationLog } from '../models/notification-logs';
import { IAuthenticationTokenDocument } from '../models/user/authentication-token';
import { User } from '../models/user/user';
import { firebaseClient } from './firebase-client';

/**
 * Push notification submission builder
 */
export class NotificationSender {
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
    constructor(tokens: IAuthenticationTokenDocument|IAuthenticationTokenDocument[]) {
        this._tokens = tokens instanceof Array ? tokens : [tokens];
    }

    /**
     * Set the title of the push notification
     * @param {string} title
     * @returns {this}
     */
    public title(title: string) {
        this._title = title;
        return this;
    }

    /**
     * Set the type of the push notification
     *
     * @param {number} type
     * @returns {this}
     */
    public type(type: number) {
        this._type = type;
        return this;
    }

    /**
     * Set the message (content) of the push notification
     *
     * @param {string} text
     * @returns {this}
     */
    public message(text: string) {
        this._message = text;
        return this;
    }

    /**
     * Add additional payload (data) into the push notification, to be received by clients
     *
     * @param payload
     * @returns {this}
     */
    public additionalPayload(payload: any) {
        this._payload = Object.assign(this._payload, payload);
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
                    type: '' + this._type,
                },
                this._payload,
            ),
        };
    }

    /**
     * Send push notification(s)
     *
     * @returns Promise<any> | Promise
     */
    public send() {
        const promises: Array<Promise<any>> = [];

        const tokens = this
            ._tokens
            .map((item: IAuthenticationTokenDocument) => item.firebaseToken)
            .unique();

        if ( tokens.length ) {
            promises.push(this._sendNotifications(tokens, this._generatePayload()));
        }

        return Promise.all(promises);
    }

    /**
     * ***Actually*** send the push notification(s)
     *
     * @param {string[]} tokens
     * @param payload
     * @returns {Promise<any>}
     * @private
     */
    private _sendNotifications(tokens: string[], payload: any) {
        return new Promise((resolve, reject) => {
            if ( ! tokens ) {
                return reject('No tokens');
            }

            const notificationLog = new NotificationLog();
            notificationLog.tokens = tokens;
            notificationLog.payload = payload;

            firebaseClient()
                .messaging()
                .sendToDevice(
                    tokens,
                    payload,
                    {
                        priority: 'high',
                        contentAvailable: true,
                    },
                )
                .then(async (response: any) => {
                    notificationLog.success = response;
                    resolve(response);

                    const promisesList: any[] = [
                        notificationLog.save(),
                    ];

                    if ( response.results ) {
                        const removeTokens: string[] = [];
                        const resultsWithIndexes = response.results.map((result: any, index: number) => ({ result, index }));

                        for ( const {result, index} of resultsWithIndexes ) {
                            if ( result.error && result.error.code === 'messaging/registration-token-not-registered' ) {
                                removeTokens.push(tokens[index]);
                            }
                        }

                        if ( removeTokens.length > 0 ) {
                            const conditions = {
                                'tokens.firebaseToken': { $in: removeTokens },
                            };

                            const update = {
                                $set: {
                                    'tokens.$.firebaseToken': '',
                                },
                            };

                            const options = {
                                multi: true,
                            };

                            promisesList.push(User.update(conditions, update, options));
                        }
                    }

                    await Promise.all(promisesList);
                })
                .catch(async (error: any) => {
                    notificationLog.error = error;
                    reject(error);

                    await notificationLog.save();
                });
        });
    }
}
