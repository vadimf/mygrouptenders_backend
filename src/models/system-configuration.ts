import { Validations } from '../controllers/v1/common/validations';
import { app } from '../server';
import { MimeType } from '../utilities/mime-type';
import { ISystemVariablesDocument } from './system-variables';

export class SystemConfiguration {
    private static _validations: Validations;

    private static get variables(): ISystemVariablesDocument {
        return app.get('system');
    }

    static get pages() {
        return {
            website: process.env.WEBSITE_BASE_URL
        };
    }

    static get validations() {
        if (!this._validations) {
            this._validations = new Validations();
        }

        return this._validations;
    }

    static get formats() {
        return {
            images: [
                MimeType.IMAGE_JPEG,
                MimeType.IMAGE_PNG,
            ],
        };
    }

    static get contactInformation(): any {
        return this.variables.contactInformation;
    }

    public static toJson() {
        return {
            pages: SystemConfiguration.pages,
            validations: SystemConfiguration.validations,
            formats: SystemConfiguration.formats,
            contactInformation: SystemConfiguration.contactInformation,
        };
    }
}
