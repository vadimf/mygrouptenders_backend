import { Document, Schema, Types } from 'mongoose';

import { IAreaDocument } from '../area';
import { ICategoryDocument } from '../category';
import { SystemConfiguration } from '../system-configuration';
import { IRatingDocument, RatingSchema } from './rating';

export interface IProviderDocument extends Document {
  categories: Types.ObjectId[] | ICategoryDocument[];
  areas: Types.ObjectId[] | IAreaDocument[];
  overview: string;
  rating: IRatingDocument;
}

export const ProviderSchema = new Schema(
  {
    categories: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Category'
      }
    ],
    areas: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Area'
      }
    ],
    overview: {
      type: Schema.Types.String,
      validate: function(value: string) {
        return SystemConfiguration.validations.providerProfileOverview.isValid(
          value
        );
      }
    },
    rating: RatingSchema
  },
  {
    _id: false
  }
);

ProviderSchema.path('categories').required(true);

ProviderSchema.path('areas').required(true);

ProviderSchema.set('toJSON', { versionKey: false });
