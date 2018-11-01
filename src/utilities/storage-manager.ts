import { Bucket } from '@google-cloud/storage';
import * as FileType from 'file-type';
import * as request from 'request';
import * as Stream from 'stream';

import { firebaseClient } from './firebase-client';
import { uuidv4 } from './UUID';

/**
 * Storage manager
 * Upload, publish, manage files into the storage bucket
 */
export class StorageManager {
  private static _bucket: Bucket;
  private _fileName: string;
  private _directory: string;

  /**
   * Initialize bucket class singleton
   */
  private static _initializeBucket() {
    StorageManager._bucket = firebaseClient()
      .storage()
      .bucket(StorageManager._getBucketName());
  }

  /**
   * Get the bucket singleton
   */
  static get bucket(): Bucket {
    if (!StorageManager._bucket) {
      StorageManager._initializeBucket();
    }

    return this._bucket;
  }

  /**
   * Get the bucket full name
   */
  private static _getBucketName() {
    return process.env.FIREBASE_PROJECT_ID + '.appspot.com';
  }

  /**
   * Set the directory which files will be saved into
   */
  public directory(directory: string) {
    this._directory = directory;
    return this;
  }

  /**
   * Set the newly-created file name
   */
  public fileName(fileName: string) {
    this._fileName = fileName;
    return this;
  }

  /**
   * Retrieve information about the file type, before uploading
   *
   * @param {Buffer} buffer
   * @param options
   * @returns {IFileTypeData}
   */
  public static getFileTypeData(
    buffer: Buffer,
    options?: { allowedMimeTypes?: string[]; knownData?: IFileTypeData }
  ): IFileTypeData {
    if (
      options &&
      options.knownData &&
      options.knownData.ext &&
      options.knownData.mime
    ) {
      return options.knownData;
    } else {
      return FileType(buffer);
    }
  }

  /**
   * Upload a file by URL
   *
   * @param {string} url
   * @param options
   * @returns {Promise<IStorageUploadingResults>}
   */
  public fromUrl(
    url: string,
    options?: { allowedMimeTypes?: string[]; knownData?: IFileTypeData }
  ): Promise<IStorageUploadingResults> {
    return new Promise((resolve, reject) => {
      request({ url: url, encoding: null }, (error, response, body) => {
        if (error) {
          reject({
            uploadingError: 'Could not retrieve buffer from url: ' + url
          });
        } else {
          return this.fromBuffer(body, options)
            .then((res: IStorageUploadingResults) => resolve(res))
            .catch((e: any) => reject(e));
        }
      });
    });
  }

  /**
   * Upload file from buffer
   *
   * @param {Buffer} buffer
   * @param options
   * @returns {Promise<{url: string}>}
   */
  public fromBuffer(
    buffer: Buffer,
    options?: { allowedMimeTypes?: string[]; knownData?: IFileTypeData }
  ): Promise<IStorageUploadingResults> {
    const that = this;

    return new Promise((resolve, reject) => {
      if (!that._fileName) {
        that.fileName(uuidv4());
      }

      if (!buffer) {
        return reject({
          uploadingError: 'No buffer to upload'
        });
      }

      const fileType: IFileTypeData = StorageManager.getFileTypeData(
        buffer,
        options
      );

      if (options && options.allowedMimeTypes && !fileType) {
        return reject({
          uploadingError:
            'Unable to retrieve mime-type from file (expected: ' +
            options.allowedMimeTypes.join(', ') +
            ')'
        });
      }

      if (
        options.allowedMimeTypes &&
        options.allowedMimeTypes.length &&
        !options.allowedMimeTypes.hasItem(fileType.mime.toString())
      ) {
        return reject({
          uploadingError:
            "File type '" +
            fileType.mime.toString() +
            "' isn't allowed. (Allowed types" +
            options.allowedMimeTypes.join(', ') +
            ')'
        });
      }

      const fileName = that._fileName + '.' + fileType.ext;
      const fullFileName =
        (this._directory ? this._directory + '/' : '') + fileName;
      const bucketFile = StorageManager.getBucketFile(fullFileName);

      const stream = StorageManager.getWritableStream(
        fullFileName,
        fileType.mime
      );

      stream
        .on('error', (e: any) => {
          return reject({
            uploadingError: 'Unable to upload to firebase storage',
            error: e
          });
        })
        .on('finish', async () => {
          await bucketFile.makePublic();
          const url = StorageManager.getPublicUrl(fullFileName);
          console.log('Finished uploading file to:', url);
          return resolve({
            url,
            mime: fileType.mime
          });
        })
        .end(buffer);
    });
  }

  /**
   * Get the full file path
   *
   * @param {string} fullFileName
   * @returns {Storage.File}
   */
  public static getBucketFile(fullFileName: string) {
    return StorageManager.bucket.file(fullFileName);
  }

  /**
   * Get writable stream for uploading files into
   *
   * @param {string} fullFileName
   * @param {string} mime
   * @returns {"fs".WriteStream}
   */
  public static getWritableStream(fullFileName: string, mime: string) {
    return StorageManager.getBucketFile(fullFileName).createWriteStream({
      metadata: {
        contentType: mime
      }
    });
  }

  /**
   * Upload files from existing stream
   *
   * @param {"stream".internal} stream
   * @param options
   */
  public fromStream(
    stream: Stream,
    options: IFileTypeData
  ): Promise<IStorageUploadingResults> {
    const that = this;

    return new Promise((resolve, reject) => {
      if (!that._fileName) {
        that.fileName(uuidv4());
      }

      const fileName = that._fileName + '.' + options.ext;
      const fullFileName =
        (this._directory ? this._directory + '/' : '') + fileName;
      const bucketFile = StorageManager.bucket.file(fullFileName);
      const bucketStream = bucketFile.createWriteStream({
        metadata: {
          contentType: options.mime
        }
      });

      bucketStream
        .on('error', () => {
          return reject({
            uploadingError: 'Unable to upload to firebase storage'
          });
        })
        .on('finish', async () => {
          await bucketFile.makePublic();
          const url = StorageManager.getPublicUrl(fullFileName);
          console.log('Finished uploading file to:', url);
          return resolve({
            url,
            mime: options.mime
          });
        });

      stream.pipe(bucketStream);
    });
  }

  /**
   * Get the public URL of files
   *
   * @param {string} fileName
   * @returns {string}
   */
  public static getPublicUrl(fileName: string): string {
    return (
      'https://storage.googleapis.com/' +
      StorageManager._getBucketName() +
      '/' +
      fileName
    );
  }

  /**
   * Remove public URL domain name, to retrieve the file name (with directories)
   *
   * @param {string} publicUrl
   * @returns {string}
   */
  public static getFilenameFromPublicUrl(publicUrl: string): string {
    return publicUrl.replace(
      'https://storage.googleapis.com/' + StorageManager._getBucketName() + '/',
      ''
    );
  }

  /**
   * Remove an existing file from storage
   *
   * @param {string} fileUrl
   * @returns {Promise<[Storage.ApiResponse]>}
   */
  public static removeFile(fileUrl: string) {
    return StorageManager.bucket
      .file(StorageManager.getFilenameFromPublicUrl(fileUrl))
      .delete();
  }
}

export interface IFileTypeData {
  ext: string;
  mime: string;
}

export interface IStorageUploadingResults {
  url: string;
  mime: string;
}
