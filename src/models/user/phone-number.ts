import * as mongoose from 'mongoose';

export interface IPhoneNumberDocument extends mongoose.Document {
    prefix: string;
    number: string;

    toDisplay(): string;
}

export const PhoneNumberSchema = new mongoose.Schema(
    {
        prefix: String,
        number: String
    },
);

PhoneNumberSchema.pre<IPhoneNumberDocument>('save', function(next) {

    this.number = this.number.replace(/\D/g, '');

    if (this.number.startsWith('0')) {
        this.number = this.number.substr(1);
    }

    next();
});

PhoneNumberSchema.method('toJSON', function() {
    return {
        prefix: this.prefix,
        number: this.number
    };
});

PhoneNumberSchema.method('toString', function() {
    return this.prefix + this.number;
});

PhoneNumberSchema.method('toDisplay', function() {
    return (this.number.charAt(0) === '0' ? '' : '0') + this.number;
});

export const PhoneNumber = mongoose.model<IPhoneNumberDocument>('PhoneNumber', PhoneNumberSchema);
