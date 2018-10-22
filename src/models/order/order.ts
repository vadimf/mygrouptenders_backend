import { ObjectId } from 'mongodb';
import { Document, model, Schema } from 'mongoose';

import { AddressSchema, IAddressDocument } from '../address';
import { ICategoryDocument } from '../category';
import { IUserDocument } from '../user/user';

export interface IOrderDocument extends Document {
  client: ObjectId | IUserDocument;
  description: string;
  approvedBid: ObjectId;
  address: IAddressDocument;
  categories: ObjectId[] | ICategoryDocument[];
  budget: number;
}

const OrderSchema = new Schema({
  client: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  description: {
    type: String,
    required: true
  },
  approvedBid: Schema.Types.ObjectId,
  address: AddressSchema,
  categories: {
    type: [Schema.Types.ObjectId],
    ref: 'Category'
  },
  budget: Number
});

export const Order = model<IOrderDocument>('Order', OrderSchema);
