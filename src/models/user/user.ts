import {
  Document,
  DocumentQuery,
  Model,
  model,
  ModelPopulateOptions,
  Query,
  Schema
} from 'mongoose';

import { uuidv4 } from '../../utilities/UUID';
import {
  AuthenticationTokenSchema,
  IAuthenticationTokenDocument
} from './authentication-token';
import { IPhoneNumberDocument, PhoneNumberSchema } from './phone-number';
import { IProfileDocument, ProfileSchema } from './profile';
import { ProviderSchema } from './provider';

export interface IUserDocument extends Document {
  profile: IProfileDocument;
  phone: IPhoneNumberDocument;
  tokens: IAuthenticationTokenDocument[];
  blockDate: Date;
  blocked: boolean;
  provider?: IProfileDocument;

  createAuthToken(): IAuthenticationTokenDocument;
  block(block: boolean): Query<IUserDocument>;

  selfUser(): any;
  toAdministrator(): any;

  populateAll: () => Promise<IUserDocument>;
}

export interface IUserModel extends Model<IUserDocument> {
  get(conditions: any): DocumentQuery<IUserDocument[], IUserDocument>;
  getSingle(
    conditions: any
  ): DocumentQuery<IUserDocument | null, IUserDocument>;
}

export const userPopulation: ModelPopulateOptions[] = [
  { path: 'profile.address.area', populate: { path: 'parent' } }
];

export const UserSchema = new Schema(
  {
    profile: { type: ProfileSchema },
    phone: { type: PhoneNumberSchema, index: true },
    tokens: {
      type: [AuthenticationTokenSchema],
      index: true,
      set: function() {
        return this.tokens;
      }
    },
    blockDate: Schema.Types.Date,
    blocked: {
      type: Boolean,
      default: false,
      set: function() {
        return this.blocked;
      }
    },
    provider: ProviderSchema
  },
  {
    timestamps: true
  }
);

// User methods
UserSchema.method('commonData', function() {
  return {
    _id: this._id,
    createdAt: this.createdAt,
    profile: this.profile || null,
    phone: this.phone || null
  };
});

UserSchema.method('createAuthToken', async function() {
  const newToken = {
    authToken: uuidv4()
  };

  await this.update({ $push: { tokens: newToken } });

  return newToken;
});

UserSchema.method('block', function(block: boolean) {
  return this.update({
    blocked: block,
    blockDate: block ? new Date() : null
  });
});

UserSchema.method('selfUser', function() {
  return Object.assign(this.commonData(), {
    // Additional data passed only to currently logged-in user
  });
});

UserSchema.method('toJSON', function() {
  return Object.assign(this.commonData(), {
    // Additinal data passed to non-logged in user (When user can see another user object)
  });
});

UserSchema.method('toAdministrator', function() {
  return Object.assign(this.commonData(), {
    // Additional data that is only accessible by administrators

    blocked: this.blocked
  });
});

UserSchema.method('populateAll', function() {
  return User.populate(this, userPopulation);
});

UserSchema.static('get', (conditions: any) =>
  User.find(conditions).populate(userPopulation)
);

UserSchema.static('getSingle', (conditions: any) =>
  User.findOne(conditions).populate(userPopulation)
);

export const User = model<IUserDocument, IUserModel>(
  'User',
  UserSchema,
  'users'
);
