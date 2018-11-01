import { Document, model, Schema, Types } from 'mongoose';

import { SystemConfiguration } from '../system-configuration';
import { IUserDocument } from './user';

export interface IFeedbackDocument extends Document {
  provider: Types.ObjectId | IUserDocument;
  client: Types.ObjectId | IUserDocument;
  review: string;
  rating: number;
}

export const FeedbackSchema = new Schema(
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
      validate: function(value: string) {
        return SystemConfiguration.validations.providerReview.isValid(value);
      }
    },
    rating: {
      type: Schema.Types.Number,
      validate: function(value: number) {
        return SystemConfiguration.validations.feedbackRating.isValid(value);
      }
    }
  },
  {
    timestamps: true
  }
);

FeedbackSchema.set('toJSON', { versionKey: false });

export const Feedback = model<IFeedbackDocument>('Feedback', FeedbackSchema);
