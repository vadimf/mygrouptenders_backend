// tslint:disable-next-line:interface-name
declare interface Number {
    between(from: number, to?: number): boolean;
    roundPrice(): number;
    addPercent(percent: number): number;
    subtractPercent(percent: number): number;
    toRad(): number;
}
