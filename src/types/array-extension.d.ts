// tslint:disable-next-line:interface-name
declare interface Array<T> {
    removeItem(item: any): number;
    itemExists(item: any): boolean;
    hasItem(item: any): boolean;
    unique(): T[];
    clean(): T[];
    isOfType(type: string): boolean;
    convertStringToNumber(): number[];
    removeByIndex(index: number): number;
}
