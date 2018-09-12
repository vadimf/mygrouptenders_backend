import * as mongoose from "mongoose";
import { IPhoneNumberDocument, PhoneNumberSchema } from "./user/phone-number";

export interface IPhoneConfirmationRequestDocument extends mongoose.Document {
    phone: IPhoneNumberDocument;
    code: string;
}

const PhoneConfirmationRequestSchema = new mongoose.Schema(
    {
        phone: {
            type: PhoneNumberSchema,
        },
        code: String,
    },
    {
        timestamps: true,
    },
);

export const PhoneConfirmationRequest = mongoose.model<IPhoneConfirmationRequestDocument>("PhoneConfirmationRequest", PhoneConfirmationRequestSchema, "phone_confirmation_requests");
