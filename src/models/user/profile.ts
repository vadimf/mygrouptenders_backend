import { Document, Schema } from 'mongoose';

import { AddressSchema, IAddressDocument } from '../address';
import { FileSchema, IFileDocument } from '../file';

export interface IProfileDocument extends Document {
  fullName: string;
  picture: IFileDocument;
  address: IAddressDocument;
}

export const ProfileSchema = new Schema(
  {
    fullName: {
      type: Schema.Types.String,
      required: true
    },
    picture: { type: FileSchema },
    address: AddressSchema
  },
  {
    _id: false
  }
);
