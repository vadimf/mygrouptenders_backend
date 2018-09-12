import * as dateformat from "dateformat";
import * as i18n from "i18n";
import * as mongoose from "mongoose";
import { FileSchema, IFileDocument } from "../file";

export interface IProfileDocument extends mongoose.Document {
    firstName: string;
    lastName: string;
    fullNames: string[];
    picture: IFileDocument;

    getFullName(): string;
}

export const ProfileSchema = new mongoose.Schema(
    {
        firstName:          String,
        lastName:           String,
        fullNames:          [String],
        picture:            { type: FileSchema },
    },
);
ProfileSchema.method("toJSON", function() {
    return {
        firstName:          this.firstName,
        lastName:           this.lastName,
        picture:            this.picture ? this.picture : null,
    };
});

ProfileSchema.pre("save", function(next) {
    if ( ! this.firstName || ! this.lastName ) {
        return next();
    }

    this.fullNames = [
        (this.firstName + " " + this.lastName).toLowerCase(),
        (this.firstName + ", " + this.lastName).toLowerCase(),
        (this.lastName + " " + this.firstName).toLowerCase(),
        (this.lastName + ", " + this.firstName).toLowerCase(),
    ];

    next();
});

ProfileSchema.method("getFullName", function() {
    return i18n.__("formatting.full_name", {
        firstName: this.firstName,
        lastName: this.lastName,
    });
});
