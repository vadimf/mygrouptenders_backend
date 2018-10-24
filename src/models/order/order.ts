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

  toJSON: () => IOrderDocument;
}

const OrderSchema = new Schema(
  {
    client: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    description: {
      type: String,
      required: true
    },
    approvedBid: Schema.Types.ObjectId,
    address: {
      type: AddressSchema,
      required: true
    },
    categories: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Category',
        required: true
      }
    ],
    budget: Number
  },
  {
    timestamps: true
  }
);

OrderSchema.methods.toJSON = function() {
  const order: IOrderDocument = this.toObject();

  delete order.__v;

  return Order.populate(order, [
    { path: 'client' },
    { path: 'address.area' },
    { path: 'categories' }
  ]);
};

export const Order = model<IOrderDocument>('Order', OrderSchema);
