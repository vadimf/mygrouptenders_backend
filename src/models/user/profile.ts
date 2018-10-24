import * as i18n from 'i18n';
import * as mongoose from 'mongoose';

import { FileSchema, IFileDocument } from '../file';

export interface IProfileDocument extends mongoose.Document {
  fullName: string;
  picture: IFileDocument;

  getFullName(): string;
}

export const ProfileSchema = new mongoose.Schema(
  {
    fullName: String,
    picture: { type: FileSchema }
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
