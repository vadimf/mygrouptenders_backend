import * as request from "request";
import sharp = require("sharp");
import { MimeType } from "../../../utilities/mime-type";
import { StorageManager } from "../../../utilities/storage-manager";
import { Utilities } from "../../../utilities/utilities";

export class UploadProfilePicture {
    private _buffer: Buffer;
    private _url: string;

    constructor(private _userId: string) {}

    public base64(base64: string) {
        this._buffer = new Buffer(base64, "base64");
        return this;
    }

    public url(url: string) {
        this._url = url;
        return this;
    }

    set buffer(value: Buffer) {
        this._buffer = value;
    }

    private async _urlToBuffer() {
        const that = this;
        return new Promise((resolve, reject) => {
            request({url: this._url, encoding: null}, (error, response, body) => {
                if ( error ) {
                    reject(error);
                }
                else {
                    that._buffer = body;
                    resolve();
                }
            });
        });
    }

    public async uploadUserProfilePicture() {
        if ( ! this._buffer && this._url ) {
            await this._urlToBuffer();
        }

        if ( ! this._buffer ) {
            throw new Error("No buffer to upload image");
        }

        const storageManager = new StorageManager();
        const fileName = Utilities.randomString(24);
        const thumbnailFileName = fileName + ".thumb";

        const thumbnailCreationBuffer = await sharp(this._buffer)
            .resize(200, 200)
            .toBuffer();

        const allowedMimeTypes = [
            MimeType.IMAGE_JPEG,
            MimeType.IMAGE_PNG,
        ];

        const profileImageUploadingPromise = storageManager
            .directory(this._userId)
            .fileName(fileName)
            .fromBuffer(
                this._buffer,
                {
                    allowedMimeTypes: allowedMimeTypes,
                },
            );

        const thumbnailUploadingPromise = storageManager
            .directory(this._userId)
            .fileName(thumbnailFileName)
            .fromBuffer(
                thumbnailCreationBuffer,
                {
                    allowedMimeTypes: allowedMimeTypes,
                },
            );

        const promisesResponse = await Promise.all([profileImageUploadingPromise, thumbnailUploadingPromise]);

        return {
            url: promisesResponse[0].url,
            thumbnail: promisesResponse[1].url,
        };
    }
}
