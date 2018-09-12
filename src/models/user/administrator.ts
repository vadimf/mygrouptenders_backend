import * as mongoose from "mongoose";
import { uuidv4 } from "../../utilities/UUID";
import { AuthenticationTokenSchema, IAuthenticationTokenDocument } from "./authentication-token";
import { IPassword, IPasswordDocument, Password, PasswordSchema } from "./password";

export interface IAdministratorDocument extends mongoose.Document {
    firstName: string;
    lastName: string;
    tokens: IAuthenticationTokenDocument[];
    passwords: IPasswordDocument[];
    email: string;

    getPasswordObject(password: string): IPassword|null;
    getCurrentPassword(): IPassword;
    changePassword(password: string): void;
    createAuthToken(): IAuthenticationTokenDocument;
}

export interface IAdministratorModel extends mongoose.Model<IAdministratorDocument> {
    get(conditions: any): mongoose.DocumentQuery<IAdministratorDocument[], IAdministratorDocument>;
    getSingle(conditions: any): mongoose.DocumentQuery<IAdministratorDocument | null, IAdministratorDocument>;
}

export const AdministratorSchema = new mongoose.Schema(
    {
        firstName:          { type: String },
        lastName:           { type: String},
        tokens:             { type: [AuthenticationTokenSchema], index: true },
        passwords:          { type: [PasswordSchema] },
        email:              { type: String, index: true },
    },
    {
        timestamps: true,
    },
);

AdministratorSchema.pre("save", function(next) {
    if ( this.email ) {
        this.email = this.email.toLowerCase();
    }

    next();
});

// User methods
AdministratorSchema.method("getPasswordObject", function(password: string) {
    for ( const passwordObject of this.passwords ) {
        if ( passwordObject.compare(password) ) {
            return passwordObject;
        }
    }

    return null;
});
AdministratorSchema.method("changePassword", function(newPassword: string) {
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
AdministratorSchema.method("createAuthToken", function() {
    if ( ! this.tokens ) {
        this.tokens = [];
    }

    const newToken = {
        authToken: uuidv4(),
    } as IAuthenticationTokenDocument;

    this.tokens = this.tokens.concat([newToken]);

    return newToken;
});
AdministratorSchema.method("getCurrentPassword", function() {
    return this.passwords.find((obj: {current: boolean}) => {
        return obj.current;
    });
});
AdministratorSchema.method("toJSON", function() {
    return {
        id: this._id,
        createdAt: this.createdAt,
        firstName: this.firstName,
        lastName: this.lastName,
        email: this.email,
    };
});

AdministratorSchema.static("get", (conditions: any) => Administrator.find(conditions));
AdministratorSchema.static("getSingle", (conditions: any) => Administrator.findOne(conditions));

export const Administrator = mongoose.model<IAdministratorDocument, IAdministratorModel>("Administrator", AdministratorSchema, "administrators");
