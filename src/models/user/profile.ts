import * as i18n from 'i18n';
import * as mongoose from 'mongoose';

import { FileSchema, IFileDocument } from '../file';

export interface IProfileDocument extends mongoose.Document {
    fullName: string;
    picture: IFileDocument;

    getFullName(): string;
}

export const ProfileSchema = new mongoose.Schema(
    {
        fullName: String,
        picture: { type: FileSchema },
    },
);
ProfileSchema.method('toJSON', function() {
    return {
        fullName: this.fullName,
        picture: this.picture ? this.picture : null,
    };
});

ProfileSchema.method('getFullName', function() {
    return i18n.__('formatting.full_name', {
        firstName: this.firstName,
        lastName: this.lastName,
    });
});
