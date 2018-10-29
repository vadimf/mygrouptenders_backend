import { Document, Schema, Types } from 'mongoose';

import { IAreaDocument } from '../area';
import { ICategoryDocument } from '../category';

export interface IProviderDocument extends Document {
  categories: Types.ObjectId[] | ICategoryDocument[];
  areas: Types.ObjectId[] | IAreaDocument[];
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
    ]
  },
  {
    _id: false
  }
);

ProviderSchema.set('toJSON', { versionKey: false });
