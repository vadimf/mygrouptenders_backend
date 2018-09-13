import * as mongoose from 'mongoose';

import { uuidv4 } from '../../utilities/UUID';
import { AuthenticationTokenSchema, IAuthenticationTokenDocument } from './authentication-token';
import { IPassword, IPasswordDocument, Password, PasswordSchema } from './password';
import { IPhoneNumberDocument, PhoneNumberSchema } from './phone-number';
import { IProfileDocument, ProfileSchema } from './profile';

export interface IUserDocument extends mongoose.Document {
    profile: IProfileDocument;
    phone?: IPhoneNumberDocument;
    tokens: IAuthenticationTokenDocument[];
    passwords: IPasswordDocument[];
    email: string;
    blocked: boolean;

    getPasswordObject(password: string): IPassword|null;
    getCurrentPassword(): IPassword;
    changePassword(password: string): void;
    createAuthToken(): IAuthenticationTokenDocument;
    block(block: boolean): void;

    selfUser(): any;
    toAdministrator(): any;
}

export interface IUserModel extends mongoose.Model<IUserDocument> {
    get(conditions: any): mongoose.DocumentQuery<IUserDocument[], IUserDocument>;
    getSingle(conditions: any): mongoose.DocumentQuery<IUserDocument | null, IUserDocument>;
}

export const UserSchema = new mongoose.Schema(
    {
        profile :           { type: ProfileSchema },
        phone:              { type: PhoneNumberSchema, index: true },
        tokens:             { type: [AuthenticationTokenSchema], index: true },
        passwords:          { type: [PasswordSchema] },
        email:              { type: String, index: true },
        blocked:            { type: Boolean, default: false },
    },
    {
        timestamps: true,
    },
);

UserSchema.pre<IUserDocument>('save', function(next) {
    if ( this.email ) {
        this.email = this.email.toLowerCase();
    }

    next();
});

// User methods
UserSchema.method('getPasswordObject', function(password: string) {
    for ( const passwordObject of this.passwords ) {
        if ( passwordObject.compare(password) ) {
            return passwordObject;
        }
    }

    return null;
});
UserSchema.method('changePassword', function(newPassword: string) {
    if ( ! this.passwords ) {
        this.passwords = [];
    }
    else {
        for (const passwordObject of this.passwords) {
            passwordObject.current = false;
        }
    }

    this.passwords = this.passwords.concat([Password.createPassword(newPassword)]);
});
UserSchema.method('createAuthToken', function() {
    if ( ! this.tokens ) {
        this.tokens = [];
    }

    const newToken = {
        authToken: uuidv4(),
    } as IAuthenticationTokenDocument;

    this.tokens = this.tokens.concat([newToken]);

    return newToken;
});
UserSchema.method('block', function(block: boolean) {
    this.blocked = block;

    if ( block ) {
        this.blockDate = new Date();
    }
    else {
        this.blockDate = null;
    }
});
UserSchema.method('getCurrentPassword', function() {
    return this.passwords.find((obj: {current: boolean}) => {
        return obj.current;
    });
});
UserSchema.method('commonData', function() {
    return {
        id: this._id,
        createdAt: this.createdAt,
        profile: this.profile || null,
        phone: this.phone || null,
        email: this.email || null,
    };
});
UserSchema.method('selfUser', function() {
    return Object.assign(
        this.commonData(),
        {
            // Additional data passed only to currently logged-in user
        },
    );
});
UserSchema.method('toJSON', function() {
    return Object.assign(
        this.commonData(),
        {
            // Additinal data passed to non-logged in user (When user can see another user object)
        },
    );
});
UserSchema.method('toAdministrator', function() {
    return Object.assign(
        this.commonData(),
        {
            // Additional data that is only accessible by administrators

            blocked: this.blocked,
        },
    );
});

export const userPopulation: string[] = [
    // Populate the following objects from DB
];

UserSchema.static('get', (conditions: any) => User.find(conditions).populate(userPopulation));
UserSchema.static('getSingle', (conditions: any) => User.findOne(conditions).populate(userPopulation));

export const User = mongoose.model<IUserDocument, IUserModel>('User', UserSchema, 'users');
