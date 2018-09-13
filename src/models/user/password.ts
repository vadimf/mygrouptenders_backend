import * as bcrypt from 'bcrypt-nodejs';
import * as mongoose from 'mongoose';

export interface IPasswordDocument extends mongoose.Document {
    hash: string;
    current: boolean;
    createdAt: Date;
}

export interface IPassword extends IPasswordDocument {
    compare(candidatePassword: string): boolean;
    setPassword(newPassword: string): void;
}

export interface IPasswordModel extends mongoose.Model<IPassword> {
    createPassword(newPassword: string): IPasswordDocument;
}

export const PasswordSchema = new mongoose.Schema(
    {
        hash:                           { type: String },
        current:                        { type: Boolean, default: true },
    },
    {
        timestamps: true,
    },
);

PasswordSchema.method('compare', function(candidatePassword: string) {
    candidatePassword = candidatePassword.replace(/[-!$%^&*()_+@\s|~=`\\#{}\[\]:";'<>?,.\/]/, '');
    return bcrypt.compareSync(candidatePassword, this.hash);
});
PasswordSchema.method('setPassword', function(newPassword: string) {
    newPassword = newPassword.replace(/[-!$%^&*()_+@\s|~=`\\#{}\[\]:";'<>?,.\/]/, '');

    const salt = bcrypt.genSaltSync(10);
    this.hash = bcrypt.hashSync(
        newPassword,
        salt,
    );
});
PasswordSchema.static('createPassword',  function(newPassword: string): Promise<IPassword> {
    const passwordObject = new this({
        current: true,
    });

    passwordObject.setPassword(newPassword);

    return passwordObject;
});
export const Password = mongoose.model<IPassword, IPasswordModel>('Password', PasswordSchema);
