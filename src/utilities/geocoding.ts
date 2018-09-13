import * as NodeGeocoder from 'node-geocoder';
import { Entry } from 'node-geocoder';

/**
 * Geocoding functions
 */
export class Geocoding {
    private static _geocoder: NodeGeocoder.Geocoder;

    /**
     * Get geocoder as singleton
     *
     * @returns {node_geocoder.Geocoder}
     */
    private static get geocoder(): NodeGeocoder.Geocoder {
        if ( ! this._geocoder ) {
            this._geocoder = NodeGeocoder({
                provider:           'google',
                httpAdapter:        'https',
                apiKey:             process.env.GOOGLE_API_KEY,
            });
        }

        return this._geocoder;
    }

    private static async _retrieveGeoLocationByString(address: string): Promise<number[]> {
        let geoLocation: Entry[];
        try {
            geoLocation = await this.geocoder.geocode(address);
        }
        catch (e) {
            console.log('Geocode failed');
        }

        if ( ! geoLocation || ! geoLocation[0] || ! (geoLocation[0].latitude || geoLocation[0].longitude) ) {
            throw new Error('Unable to retrieve coordinates for: ' + address);
        }

        return [geoLocation[0].latitude, geoLocation[0].longitude];
    }
}
