import { ObjectId } from 'mongodb';
import { Document, model, Schema } from 'mongoose';

export interface IAreaDocument extends Document {
  title: string;
  parent: ObjectId | IAreaDocument;
  displayOrder: number;
}

export const AreaSchema = new Schema({
  title: String,
  parent: {
    type: Schema.Types.ObjectId,
    ref: 'Area'
  },
  displayOrder: Number
});

AreaSchema.methods.toJSON = function() {
  const area: IAreaDocument = this.toObject();

  delete area.__v;

  return area;
};

export const Area = model<IAreaDocument>('Area', AreaSchema);
