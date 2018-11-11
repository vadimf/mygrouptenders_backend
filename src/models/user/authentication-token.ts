import * as mongoose from 'mongoose';

export interface IAuthenticationTokenDocument {
  authToken: string;
  firebaseToken?: string;
}

export const AuthenticationTokenSchema = new mongoose.Schema(
  {
    authToken: {
      type: String,
      required: true,
      index: true
    },
    firebaseToken: {
      type: String
    }
  },
  {
    timestamps: true
  }
);
