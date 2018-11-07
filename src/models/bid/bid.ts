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
import { IOrderDocument } from '../order/order';
import { SystemConfiguration } from '../system-configuration';
import { IUserDocument } from '../user/user';

export interface IBidSearchConditions {
  order?: any;
  status?: any;
  provider?: any;
  archived?: any;
}

export interface IBidDocument extends Document {
  order: Types.ObjectId | IOrderDocument;
  provider: Types.ObjectId | IUserDocument;
  status: BidStatus;
  archived: boolean;
  bid: number;
  prevBids: number[];
  comment: string;

  populateAll(): Promise<IBidDocument>;
}

export interface IBidModel extends Model<IBidDocument> {
  get: (
    conditions: IBidSearchConditions,
    population?: ModelPopulateOptions[]
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

export const bidPopulationForProvider: ModelPopulateOptions[] = [
  {
    path: 'order',
    populate: [
      { path: 'client' },
      { path: 'categories', populate: { path: 'parent' } }
    ]
  }
];

export const BidSchema = new Schema(
  {
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      set: function(value: Types.ObjectId) {
        return this.order || value;
      }
    },
    provider: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      set: function(value: Types.ObjectId) {
        return this.provider || value;
      }
    },
    status: {
      type: Schema.Types.Number,
      default: BidStatus.Placed
    },
    archived: {
      type: Boolean,
      default: false
    },
    bid: {
      type: Schema.Types.Number,
      required: true,
      set: function(value: number) {
        if (typeof this.bid === 'number' && this.bid !== value) {
          this.prevBids = [...this.prevBids, this.bid];
        }

        return value;
      }
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

BidSchema.static('get', function(
  conditions: IBidSearchConditions,
  population?: ModelPopulateOptions[]
) {
  return Bid.find(conditions).populate(population || bidPopulation);
});

export const Bid = model<IBidDocument, IBidModel>('Bid', BidSchema);
