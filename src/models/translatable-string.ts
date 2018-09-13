import * as mongoose from 'mongoose';
import { app } from '../server';

export interface ITranslationDocument extends mongoose.Document {
    languageCode: string;
    text: string;
}

export const TranslationSchema = new mongoose.Schema({
    languageCode: String,
    text: String,
});

export interface ITranslatableStringDocument extends mongoose.Document {
    original: string;
    translations: mongoose.Types.Array<ITranslationDocument>;

    getByLanguageCode(language: string): string;
}

export const TranslatableStringSchema = new mongoose.Schema(
    {
        original:                   String,
        translations:               { type: [TranslationSchema] },
    },
);

TranslatableStringSchema.method('toString', function() {
    const language = app.get('language');
    return this.getByLanguageCode(language);
});

TranslatableStringSchema.method('getByLanguageCode', function(language: string) {
    const translation = this.translations.find((obj: {languageCode: string}) => {
        return obj.languageCode === language;
    });

    if ( translation && translation.text ) {
        return translation.text;
    }

    return this.original;
});
