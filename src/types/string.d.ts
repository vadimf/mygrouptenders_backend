// tslint:disable-next-line:interface-name
declare interface String {
    emailRegex: RegExp;
    isEmail(): boolean;
    toRegex(): RegExp;
    searchToRegex(removeSpecialCharacters?: boolean, start?: boolean, end?: boolean): RegExp;
    parseJson(): any;
    isMongoId(): boolean;
    encodeHtml(): string;
    decodeHtml(): string;
}
