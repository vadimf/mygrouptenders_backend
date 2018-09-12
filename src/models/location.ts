export class Location {
    private static _earthRadius = 6371;

    constructor(public lat: number, public lng: number) {}

    // FIXME: Unit implementation is imcomplete
    public distanceFromPoint(location: Location, unit: DistanceUnit = DistanceUnit.KM, decimals= 2) {
        const dLat = (location.lat - this.lat).toRad();
        const dLon = (location.lng - this.lng).toRad();
        const lat1Rad = this.lat.toRad();
        const lat2Rad = location.lat.toRad();

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1Rad) * Math.cos(lat2Rad);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = Location._earthRadius * c;
        return Math.round(d * Math.pow(10, decimals)) / Math.pow(10, decimals);
    }
}

export enum DistanceUnit {
    KM,
    Mile,
}
