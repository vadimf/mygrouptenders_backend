import { ObjectId } from 'mongodb';
import { Document, Schema } from 'mongoose';

import { IAreaDocument } from './area';

export interface IAddressDocument extends Document {
  address: string;
  appartment: string;
  area: ObjectId | IAreaDocument;
}

export const AddressSchema = new Schema(
  {
    address: {
      type: String,
      required: true
    },
    appartment: String,
    area: {
      type: Schema.Types.ObjectId,
      ref: 'Area',
      required: true
    }
  },
  {
    _id: false
  }
);

AddressSchema.set('toJSON', { versionKey: false });
