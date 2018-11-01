import * as admin from 'firebase-admin';
import * as fs from 'fs';

let initialized = false;

/**
 * Turn firebase SDK into singleton
 *
 * @returns {admin}
 */
export function firebaseClient() {
    if ( ! initialized ) {
        const firebasePrivateCertificate = fs.readFileSync(__dirname + '/../../config/firebase.pem', 'utf8');

        const options = {
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                privateKey: firebasePrivateCertificate,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            }),
            databaseURL: process.env.FIREBASE_DATABASE_URL,
        };

        admin.initializeApp(options);

        initialized = true;
    }

    return admin;
}
