import * as mongoose from "mongoose";

export interface ISystemVariablesDocument extends mongoose.Document {
    contactInformation: {
        info: string,
        support: string,
    };
}

export const SystemVariablesSchema = new mongoose.Schema(
    {
        contactInformation: Object,
    },
);

export const SystemVariables = mongoose.model<ISystemVariablesDocument>("System", SystemVariablesSchema, "system");
