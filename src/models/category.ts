import { ObjectId } from 'mongodb';
import { Document, model, Schema } from 'mongoose';

export interface ICategoryDocument extends Document {
  title: string;
  parent: ObjectId | ICategoryDocument;
  displayOrder: number;
}

export const CategorySchema = new Schema({
  title: String,
  parent: {
    type: Schema.Types.ObjectId,
    ref: 'Category'
  },
  displayOrder: Number
});

CategorySchema.set('toJSON', { versionKey: false });

export const Category = model<ICategoryDocument>('Category', CategorySchema);
