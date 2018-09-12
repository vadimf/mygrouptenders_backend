import * as express from "express";
import { ILanguageDocument, Language } from "../../../models/language";
import { ITranslatableStringDocument, ITranslationDocument } from "../../../models/translatable-string";
import { AsyncMiddleware } from "../../../server";

const router = express.Router();

/**
 * Output the available languages for the application
 */
router.get("/", AsyncMiddleware(async (req: express.Request, res: express.Response) => {
    let languages = await Language.find({})
        .sort("displayOrder");

    if ( ! languages.length ) {
        languages = [
            new Language({
                title: {
                    original: "Hebrew",
                    translations: [
                        {
                            languageCode: "he",
                            text: "עברית",
                        } as ITranslationDocument,
                    ],
                } as ITranslatableStringDocument,
                code: "he",
                displayOrder: 1,
            }),
            new Language({
                title: {
                    original: "English",
                    translations: [
                        {
                            languageCode: "he",
                            text: "אנגלית",
                        } as ITranslationDocument,
                    ],
                } as ITranslatableStringDocument,
                code: "en",
                displayOrder: 2,
            }),
            new Language({
                title: {
                    original: "Russian",
                    translations: [
                        {
                            languageCode: "ru",
                            text: "Русский",
                        } as ITranslationDocument,
                        {
                            languageCode: "he",
                            text: "רוסית",
                        } as ITranslationDocument,
                    ],
                } as ITranslatableStringDocument,
                code: "ru",
                displayOrder: 3,
            }),
            new Language({
                title: {
                    original: "Arabic",
                    translations: [
                        {
                            languageCode: "ar",
                            text: "العربية",
                        } as ITranslationDocument,
                        {
                            languageCode: "he",
                            text: "ערבית",
                        } as ITranslationDocument,
                    ],
                } as ITranslatableStringDocument,
                code: "ar",
                displayOrder: 4,
            }),
            new Language({
                title: {
                    original: "Amharic",
                    translations: [
                        {
                            languageCode: "am",
                            text: "አማርኛ",
                        } as ITranslationDocument,
                        {
                            languageCode: "he",
                            text: "אמהרית",
                        } as ITranslationDocument,
                    ],
                } as ITranslatableStringDocument,
                code: "am",
                displayOrder: 5,
            }),
            new Language({
                title: {
                    original: "French",
                    translations: [
                        {
                            languageCode: "fr",
                            text: "Français",
                        } as ITranslationDocument,
                        {
                            languageCode: "he",
                            text: "עברית",
                        } as ITranslationDocument,
                    ],
                } as ITranslatableStringDocument,
                code: "fr",
                displayOrder: 6,
            }),
            new Language({
                title: {
                    original: "Spanish",
                    translations: [
                        {
                            languageCode: "es",
                            text: "Español",
                        } as ITranslationDocument,
                        {
                            languageCode: "he",
                            text: "עברית",
                        } as ITranslationDocument,
                    ],
                } as ITranslatableStringDocument,
                code: "es",
                displayOrder: 7,
            }),
        ];

        languages.forEach(async (item: ILanguageDocument) => {
            await item.save();
        });
    }

    res.response({
        languages: languages,
    });
}));

export default router;
