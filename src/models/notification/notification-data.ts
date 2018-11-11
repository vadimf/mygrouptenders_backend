import { Document, Schema, Types } from 'mongoose';

import { IBidDocument } from '../bid/bid';
import { IOrderDocument } from '../order/order';
import { IUserDocument } from '../user/user';

export interface INotificationDataDocument extends Document {
  title?: string;
  message?: string;
  order?: Types.ObjectId | IOrderDocument;
  bid?: Types.ObjectId | IBidDocument;
  provider?: Types.ObjectId | IUserDocument;
}

export const NotificationDataSchema = new Schema({
  title: Schema.Types.String,
  message: Schema.Types.String,
  order: {
    type: Schema.Types.ObjectId,
    ref: 'Order'
  },
  bid: {
    type: Schema.Types.ObjectId,
    ref: 'Bid'
  }
});
