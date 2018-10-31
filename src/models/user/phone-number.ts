import { Document, model, Schema } from 'mongoose';

export interface IPhoneNumberDocument extends Document {
  prefix: string;
  number: string;

  toDisplay(): string;
  compare(): boolean;
}

export const PhoneNumberSchema = new Schema(
  {
    prefix: String,
    number: String
  },
  {
    _id: false
  }
);

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

PhoneNumberSchema.method('compare', function(phone: IPhoneNumberDocument) {
  return (
    !!phone && this.prefix === phone.prefix && this.number === phone.number
  );
});

export const PhoneNumber = model<IPhoneNumberDocument>(
  'PhoneNumber',
  PhoneNumberSchema
);
