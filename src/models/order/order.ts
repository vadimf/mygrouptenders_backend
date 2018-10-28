import {
  Document,
  DocumentQuery,
  Model,
  model,
  ModelPopulateOptions,
  Schema,
  Types
} from 'mongoose';

import { AddressSchema, IAddressDocument } from '../address';
import { ICategoryDocument } from '../category';
import { OrderStatus } from '../enums';
import { IUserDocument } from '../user/user';

export interface IOrderDocument extends Document {
  client: Types.ObjectId | IUserDocument;
  description: string;
  approvedBid: Types.ObjectId;
  address: IAddressDocument;
  categories: Types.ObjectId[] | ICategoryDocument[];
  budget: number;
  urgent: boolean;
  status: OrderStatus;

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
        ref: 'Category'
      }
    ],
    budget: Number,
    urgent: {
      type: Boolean,
      default: false
    },
    status: {
      type: Number,
      default: OrderStatus.Placed
    }
  },
  {
    timestamps: true
  }
);

OrderSchema.path('categories')
  .required(true)
  .set(function(value: Types.ObjectId[]) {
    return !!this.categories && !!this.categories.length
      ? this.categories
      : value;
  });

OrderSchema.set('toJSON', { versionKey: false });

OrderSchema.pre<IOrderDocument>('save', function(next) {
  this.status = this.isNew ? OrderStatus.Placed : this.status;

  next();
});

OrderSchema.method('populateAll', function() {
  return Order.populate(this, orderPopulation);
});

OrderSchema.static('get', function(conditions: any) {
  return Order.find(conditions);
});

export const Order = model<IOrderDocument, IOrderModel>('Order', OrderSchema);
