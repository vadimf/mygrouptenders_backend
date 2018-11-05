import * as moment from 'moment';
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
import { bidPopulation, IBidDocument } from '../bid/bid';
import { ICategoryDocument } from '../category';
import { OrderStatus } from '../enums';
import { FileSchema, IFileDocument } from '../file';
import { IUserDocument } from '../user/user';

export const MIN_PROLONGATION_HOURS = 12;

export interface IOrderSearchConditions {
  client?: any;
  status?: any;
  categories?: any;
  'address.area'?: any;
}

export interface IOrderDocument extends Document {
  expirationDate: Date;
  client: Types.ObjectId | IUserDocument;
  description: string;
  approvedBid: Types.ObjectId | IBidDocument;
  address: IAddressDocument;
  categories: Types.ObjectId[] | ICategoryDocument[];
  budget: number;
  urgent: boolean;
  status: OrderStatus;
  media: IFileDocument[];

  toJSON: () => IOrderDocument;
  populateAll: () => Promise<IOrderDocument>;
}

export interface IOrderModel extends Model<IOrderDocument> {
  get: (
    conditions: IOrderSearchConditions
  ) => DocumentQuery<IOrderDocument[], IOrderDocument>;
  populateAll: (
    docs: IOrderDocument | IOrderDocument[]
  ) => Promise<IOrderDocument | IOrderDocument[]>;
}

export const orderPopulation: ModelPopulateOptions[] = [
  { path: 'client' },
  { path: 'approvedBid', populate: bidPopulation },
  { path: 'address.area', populate: { path: 'parent' } },
  { path: 'categories', populate: { path: 'parent' } }
];

const OrderSchema = new Schema(
  {
    expirationDate: {
      type: Schema.Types.Date,
      validate: {
        validator: function(value: any) {
          if (!this.isModified('expirationDate')) {
            return true;
          }

          const now = moment().startOf('minutes');
          const momentValue = moment(value).startOf('minutes');

          return momentValue.diff(now, 'h') >= MIN_PROLONGATION_HOURS;
        }
      },
      default: moment()
        .add(12, 'h')
        .toDate(),
      required: true
    },
    client: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      set: function(value: Types.ObjectId) {
        return this.client || value;
      }
    },
    description: {
      type: String,
      required: true
    },
    approvedBid: {
      type: Schema.Types.ObjectId,
      ref: 'Bid'
    },
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
    },
    media: [FileSchema]
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
  this.expirationDate = this.isNew
    ? moment()
        .add(12, 'h')
        .toDate()
    : this.expirationDate;

  next();
});

OrderSchema.method('populateAll', function() {
  return Order.populate(this, orderPopulation);
});

OrderSchema.static('get', function(conditions: IOrderSearchConditions) {
  return Order.find(conditions).populate(orderPopulation);
});

OrderSchema.static('populateAll', function(
  docs: IOrderDocument | IOrderDocument[]
) {
  return Order.populate(docs, orderPopulation);
});

export const Order = model<IOrderDocument, IOrderModel>('Order', OrderSchema);
