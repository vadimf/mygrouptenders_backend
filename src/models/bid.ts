import { Document, model, Schema, Types } from 'mongoose';

import { IOrderDocument } from './order/order';
import { IUserDocument } from './user/user';

export interface IBidDocument extends Document {
  order: Types.ObjectId | IOrderDocument;
  provider: Types.ObjectId | IUserDocument;
  isApproved: boolean;
  bid: number;
  prevBids: number[];
  comment: string;
}

export const BidSchema = new Schema({
  order: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  provider: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isApproved: {
    type: Schema.Types.Boolean,
    default: false
  },
  bid: {
    type: Schema.Types.Number,
    required: true
  },
  prevBids: [Schema.Types.Number],
  comment: Schema.Types.String
});

BidSchema.set('toJSON', { versionKey: false });

export const Bid = model<IBidDocument>('Bid', BidSchema);
