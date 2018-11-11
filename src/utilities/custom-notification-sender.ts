import * as i18n from 'i18n';

import { IBidDocument } from '../models/bid/bid';
import { ICategoryDocument } from '../models/category';
import { NotificationType, UserRole } from '../models/enums';
import {
  INotificationDocument,
  Notification
} from '../models/notification/notification';
import { INotificationDataDocument } from '../models/notification/notification-data';
import { IOrderDocument } from '../models/order/order';
import { IAuthenticationTokenDocument } from '../models/user/authentication-token';
import { IUserDocument } from '../models/user/user';
import { NotificationSender } from './notification-sender';

export class CustomNotificationSender extends NotificationSender<
  Partial<INotificationDataDocument>
> {
  constructor(users: IUserDocument | IUserDocument[], forRole = UserRole.All) {
    let tokens: IAuthenticationTokenDocument[] = [];
    const notifications: INotificationDocument[] = [];

    if (users.constructor === Array) {
      users = users as IUserDocument[];

      for (const user of users) {
        tokens = tokens.concat(
          CustomNotificationSender._getTokensFromUser(user)
        );

        notifications.push(
          new Notification({
            user: user._id,
            for: forRole,
            tokens
          })
        );
      }
    } else {
      const user = users as IUserDocument;

      tokens = CustomNotificationSender._getTokensFromUser(user);

      notifications.push(
        new Notification({
          user: user._id,
          for: forRole,
          tokens
        })
      );
    }

    super(tokens, notifications);

    this.title(process.env.APP_NAME);
  }

  private static _getTokensFromUser(
    user: IUserDocument
  ): IAuthenticationTokenDocument[] {
    if (!user.tokens || !user.tokens.length) {
      return [];
    }

    return user.tokens.filter(
      (item: IAuthenticationTokenDocument) => !!item.firebaseToken
    );
  }

  public bidPlaced(
    order: IOrderDocument,
    bid: IBidDocument,
    provider: IUserDocument
  ) {
    return this.type(NotificationType.BidPlaced)
      .title(
        i18n
          .__('notifications.bidCreated.title', {
            providerName: provider.profile.fullName
          })
          .decodeHtml()
      )
      .message(
        i18n
          .__('notifications.bidCreated.body', {
            categories: (order.categories as ICategoryDocument[])
              .map((category: ICategoryDocument) => category.title)
              .join(', '),
            budget: order.budget.toString()
          })
          .decodeHtml()
      )
      .additionalPayload({
        order: order._id,
        bid: order._id,
        provider: provider._id
      });
  }
}
