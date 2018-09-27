import { ObjectId } from 'mongodb';
import { Document, model, Schema } from 'mongoose';

import { ICategoryDocument } from '../category';
import { IUserDocument } from '../user/user';

export interface IOrderDocument extends Document {
    client: ObjectId | IUserDocument;
    description: string;
    approvedBid: ObjectId;
    categories: ObjectId[] | ICategoryDocument[];
}

const OrderSchema = new Schema({
    client: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    description: {
        type: String,
        required: true
    },
    approvedBid: Schema.Types.ObjectId,
    categories: {
        type: [Schema.Types.ObjectId],
        ref: 'Category'
    }
});

export const Order = model<IOrderDocument>('Order', OrderSchema);
