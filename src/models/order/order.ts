import { ObjectId } from 'mongodb';
import {
  Document,
  DocumentQuery,
  Model,
  model,
  ModelPopulateOptions,
  Schema
} from 'mongoose';

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
  populateAll: () => IOrderDocument | IOrderDocument[];
}

export interface IOrderModel extends Model<IOrderDocument> {
  get: (conditions: any) => DocumentQuery<IOrderDocument[], IOrderDocument>;
}

export const orderPopulation: ModelPopulateOptions[] = [
  { path: 'client' },
  { path: 'address.area', populate: { path: 'parent' } },
  { path: 'categories', populate: { path: 'parent' } }
];

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

OrderSchema.set('toJSON', { versionKey: false });

OrderSchema.method('populateAll', function() {
  return Order.populate(this, orderPopulation);
});

OrderSchema.static('get', function(conditions: any) {
  return Order.find(conditions).populate(orderPopulation);
});

export const Order = model<IOrderDocument, IOrderModel>('Order', OrderSchema);
