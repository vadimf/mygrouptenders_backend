import * as mongoose from 'mongoose';

export const extendSchema = (schema: mongoose.Schema, obj: any, options?: any) => {
    const newSchema = new mongoose.Schema(
        Object.assign({}, schema.obj, obj),
        options,
    );

    newSchema.methods = schema.methods;

    return newSchema;
};
