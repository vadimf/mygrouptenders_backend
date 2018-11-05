import {
  Document,
  DocumentQuery,
  Model,
  model,
  ModelPopulateOptions,
  Schema,
  Types
} from 'mongoose';

import { BidStatus } from '../enums';
import { IOrderDocument, orderPopulation } from '../order/order';
import { SystemConfiguration } from '../system-configuration';
import { IUserDocument } from '../user/user';

export interface IBidSearchConditions {
  order?: any;
  status?: any;
}

export interface IBidDocument extends Document {
  order: Types.ObjectId | IOrderDocument;
  provider: Types.ObjectId | IUserDocument;
  status: BidStatus;
  bid: number;
  prevBids: number[];
  comment: string;

  populateAll(): Promise<IBidDocument>;
}

export interface IBidModel extends Model<IBidDocument> {
  get: (
    conditions: IBidSearchConditions
  ) => DocumentQuery<IBidDocument[], IBidDocument>;
}

export const bidPopulation: ModelPopulateOptions[] = [
  {
    path: 'provider',
    populate: [
      { path: 'provider.categories', populate: [{ path: 'parent' }] },
      { path: 'provider.areas', populate: [{ path: 'parent' }] }
    ]
  }
];

export const BidSchema = new Schema(
  {
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
    status: {
      type: Schema.Types.Number,
      default: BidStatus.Placed
    },
    bid: {
      type: Schema.Types.Number,
      required: true
    },
    prevBids: [Schema.Types.Number],
    comment: {
      type: Schema.Types.String,
      validate: function(value: string) {
        return SystemConfiguration.validations.bidComment.isValid(value);
      }
    }
  },
  {
    timestamps: true
  }
);

BidSchema.set('toJSON', { versionKey: false });

BidSchema.pre<IBidDocument>('save', function(next) {
  this.status = this.isNew ? BidStatus.Placed : this.status;

  next();
});

BidSchema.method('populateAll', function() {
  return Bid.populate(this, bidPopulation);
});

BidSchema.static('get', function(conditions: IBidSearchConditions) {
  return Bid.find(conditions).populate(bidPopulation);
});

export const Bid = model<IBidDocument, IBidModel>('Bid', BidSchema);
