// tslint:disable-next-line:no-namespace
declare module 'mongoose' {
  // tslint:disable-next-line:interface-name
  interface Model<T extends Document> {
    new (doc: any, strict?: boolean): T;
  }
}
