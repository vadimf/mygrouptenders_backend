import * as mongoose from 'mongoose';
import { ITranslationDocument, TranslatableStringSchema } from './translatable-string';

export interface ILanguageDocument extends mongoose.Document {
    title: ITranslationDocument;
    code: string;
    displayOrder: number;
}

export const LanguageSchema = new mongoose.Schema(
    {
        title:              TranslatableStringSchema,
        code:               { type: String, unique: true, sparse: true },
        displayOrder:       { type: Number },
    },
);
LanguageSchema.methods.toJSON = function() {
    return {
        code:               this.code,
        title:              this.title.toString(),
        nativeTitle:        this.title.getByLanguageCode(this.code),
        latinTitle:         this.title.original,
    };
};

export const Language = mongoose.model<ILanguageDocument>('Language', LanguageSchema, 'languages');
