import { Document, Schema } from 'mongoose';

export interface IRatingDocument extends Document {
  reviewersAmount: number;
  ratingsSum: number;
}

export const RatingSchema = new Schema(
  {
    reviewersAmount: {
      type: Schema.Types.Number,
      required: true
    },
    ratingsSum: {
      type: Schema.Types.Number,
      required: true
    }
  },
  {
    _id: false
  }
);

RatingSchema.set('toJSON', { versionKey: false });

RatingSchema.virtual('rating').get(function() {
  return Math.round((this.ratingsSum / this.reviewersAmount) * 100) / 100;
});
