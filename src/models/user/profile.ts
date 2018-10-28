import * as mongoose from 'mongoose';

import { AddressSchema, IAddressDocument } from '../address';
import { FileSchema, IFileDocument } from '../file';

export interface IProfileDocument extends mongoose.Document {
  fullName: string;
  picture: IFileDocument;
  address: IAddressDocument;

  getFullName(): string;
}

export const ProfileSchema = new mongoose.Schema(
  {
    fullName: String,
    picture: { type: FileSchema },
    address: AddressSchema
  },
  {
    _id: false
  }
);
ProfileSchema.method('toJSON', function() {
  return {
    fullName: this.fullName,
    picture: this.picture ? this.picture : null
  };
});
