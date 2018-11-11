import * as i18n from 'i18n';
import { IBidDocument } from '../models/bid/bid';
import { ICategoryDocument } from '../models/category';
import { IOrderDocument } from '../models/order/order';
import { IAuthenticationTokenDocument } from '../models/user/authentication-token';
import { IUserDocument } from '../models/user/user';
import { NotificationSender } from './notification-sender';

export enum NotificationType {
    General,
    BidCreated,
}

export class CustomNotificationSender extends NotificationSender {
    constructor(users: IUserDocument|IUserDocument[]) {
        let tokens: IAuthenticationTokenDocument[] = [];
        if ( users.constructor === Array ) {
            users = users as IUserDocument[];

            for ( const user of users ) {
                tokens = tokens.concat(
                    CustomNotificationSender._getTokensFromUser(user),
                );
            }

            super(tokens);
        }
        else {
            const user = users as IUserDocument;

            super(CustomNotificationSender._getTokensFromUser(user));
        }
        this.title(process.env.APP_NAME);
    }

    private static _getTokensFromUser(user: IUserDocument): IAuthenticationTokenDocument[] {
        if ( ! user.tokens || ! user.tokens.length ) {
            return [];
        }

        return user.tokens.filter((item: IAuthenticationTokenDocument) => !!item.firebaseToken);
    }

    public bidGenerated(order: IOrderDocument, bid: IBidDocument, provider: IUserDocument) {
        return this
            .type(NotificationType.BidCreated)
            .title(
                i18n.__(
                    'notifications.bidCreated.title',
                    {
                        providerName: provider.profile.fullName
                    }
                ).decodeHtml(),
            )
            .message(
                i18n.__(
                    'notifications.bidCreated.body',
                    {
                        categories: (order.categories as ICategoryDocument[]).map((category: ICategoryDocument) => category.title).join(', '),
                        budget: order.budget.toString(),
                    }
                ).decodeHtml(),
            )
            .additionalPayload({
                orderId: order._id,
                bidId: order._id,
                providerId: provider._id,
            });
    }
}
