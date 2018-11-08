import { Document, Model, model, Schema, Types } from 'mongoose';

import { SystemConfiguration } from '../system-configuration';
import { IUserDocument } from '../user/user';

export interface IReviewDocument extends Document {
  provider: Types.ObjectId | IUserDocument;
  client: Types.ObjectId | IUserDocument;
  review: string;
  rating: number;
}

export interface IReviewModel extends Model<IReviewDocument> {}

export const ReviewSchema = new Schema(
  {
    provider: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    client: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    review: {
      type: Schema.Types.String,
      required: true,
      validate: function(value: string) {
        return SystemConfiguration.validations.providerReview.isValid(value);
      }
    },
    rating: {
      type: Schema.Types.Number,
      required: true,
      validate: function(value: number) {
        return SystemConfiguration.validations.reviewRating.isValid(value);
      }
    }
  },
  {
    timestamps: true
  }
);

ReviewSchema.set('toJSON', { versionKey: false });

export const Review = model<IReviewDocument>('Review', ReviewSchema);
