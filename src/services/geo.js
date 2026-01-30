import * as Geolib from 'geolib';

// State for Compass
let currentHeading = null;

// Initialize Compass Listener
export function initCompass() {
    if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientationabsolute', (event) => {
            // Android/Chrome support 'deviceorientationabsolute'
            if (event.webkitCompassHeading) {
                // iOS
                currentHeading = event.webkitCompassHeading;
            } else if (event.alpha) {
                // Android (alpha is roughly compass on some devices, but complex)
                // Simplification: alpha is 0 at North on 'deviceorientationabsolute'
                currentHeading = 360 - event.alpha;
            }
        });

        // Fallback for standard event (often relative, but better than nothing)
        window.addEventListener('deviceorientation', (event) => {
            if (event.webkitCompassHeading) {
                currentHeading = event.webkitCompassHeading;
            } else if (!currentHeading && event.alpha) {
                // Only use relative alpha if absolute failed
                currentHeading = 360 - event.alpha;
            }
        });
    }
}

export function getCurrentHeading() {
    return currentHeading;
}

export async function getPosition() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("Geolocation not supported"));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                resolve({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                    heading: pos.coords.heading // GPS movement heading (often null when standing still)
                });
            },
            (err) => {
                reject(err);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    });
}

// Calculate Destination Point
export function calculateOffsetPosition(lat, lng, distanceMeters, bearing) {
    // If bearing is unknown, return original position
    if (bearing === null || bearing === undefined) {
        console.warn("No heading available, using raw GPS position");
        return { lat, lng, offsetApplied: false };
    }

    // Use Geolib for precise Geodesic calculation
    const dest = Geolib.computeDestinationPoint(
        { latitude: lat, longitude: lng },
        distanceMeters,
        bearing
    );

    return {
        lat: dest.latitude,
        lng: dest.longitude,
        originalLat: lat,
        originalLng: lng,
        headingUsed: bearing,
        offsetApplied: true
    };
}
