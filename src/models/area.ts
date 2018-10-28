import { Document, model, Schema, Types } from 'mongoose';

export interface IAreaDocument extends Document {
  title: string;
  parent: Types.ObjectId | IAreaDocument;
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

AreaSchema.set('toJSON', { versionKey: false });

export const Area = model<IAreaDocument>('Area', AreaSchema);
