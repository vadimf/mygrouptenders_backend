import * as mongoose from 'mongoose';

export interface IAuthenticationTokenDocument {
    authToken: string;
}

export const AuthenticationTokenSchema = new mongoose.Schema(
    {
        authToken: {
            type:                   String,
            required:               true,
            index:                  true,
        },
    },
    {
        timestamps:                 true,
    },
);
