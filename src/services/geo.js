import * as Geolib from 'geolib';
import { CONSTANTS } from '../constants.js';

// State for Compass
let currentHeading = null;

// Initialize Compass Listener
export function initCompass() {
    if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientationabsolute', (event) => {
            // Android/Chrome support 'deviceorientationabsolute'
            // Low Pass Filter (Smoothing)
            // alpha = 0.1 (Heavy smoothing), 1.0 (No smoothing)
            const alpha = 0.15;
            let rawHeading = 0;

            if (event.webkitCompassHeading) {
                rawHeading = event.webkitCompassHeading;
            } else if (event.alpha) {
                rawHeading = 360 - event.alpha;
            }

            if (currentHeading === null) {
                currentHeading = rawHeading;
            } else {
                // Handle 359 -> 1 degree transition (Wrap around)
                let diff = rawHeading - currentHeading;
                if (diff > 180) diff -= 360;
                if (diff < -180) diff += 360;
                currentHeading += diff * alpha;

                // Normalize to 0-360
                if (currentHeading < 0) currentHeading += 360;
                if (currentHeading >= 360) currentHeading -= 360;
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

// Check if we have received valid data (implicit permission)
export function hasCompassAccess() {
    return currentHeading !== null;
}

// State for GPS
// State for GPS
let lastPosition = null;
try {
    const stored = localStorage.getItem('last_known_pos');
    if (stored) lastPosition = JSON.parse(stored);
} catch (e) { console.error("Error loading cached pos", e); }
let watcherId = null;

export function startTracking() {
    if (watcherId) return; // Already tracking
    if (!navigator.geolocation) return;

    watcherId = navigator.geolocation.watchPosition(
        (pos) => {
            lastPosition = {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
                heading: pos.coords.heading,
                timestamp: Date.now()
            };
            localStorage.setItem('last_known_pos', JSON.stringify(lastPosition));
        },
        (err) => {
            console.warn("GPS Tracking Warning:", err);
        },
        {
            enableHighAccuracy: true,
            maximumAge: CONSTANTS.GPS_MAX_AGE_MS,
            timeout: 20000 // Watcher timeout slightly longer
        }
    );
}

export function updatePosition(pos) {
    if (pos.coords) {
        // Raw GeolocationPosition
        lastPosition = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            heading: pos.coords.heading,
            timestamp: Date.now()
        };
    } else if (pos.lat !== undefined && pos.lng !== undefined) {
        // Already processed object
        lastPosition = {
            lat: pos.lat,
            lng: pos.lng,
            accuracy: pos.accuracy || 0,
            heading: pos.heading || null,
            timestamp: Date.now()
        };
    } else {
        console.warn("Invalid position object passed to updatePosition", pos);
        return;
    }
    localStorage.setItem('last_known_pos', JSON.stringify(lastPosition));
}

export function getLastKnownPosition() {
    return lastPosition;
}

export async function getPosition(forceFresh = false) {
    // Return cached position if fresh (< 20s old) and not forced
    if (!forceFresh && lastPosition && (Date.now() - lastPosition.timestamp < (CONSTANTS.GPS_MAX_AGE_MS * 2))) {
        return lastPosition;
    }

    // Otherwise force a generic check (fallback if watcher hasn't fired yet)
    // But better: wait for watcher? 
    // For now, keep standard check but use lastPosition as backup in catch block
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("Geolocation not supported"));
            return;
        }

        const success = (pos) => {
            const p = {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
                heading: pos.coords.heading
            };
            lastPosition = { ...p, timestamp: Date.now() }; // Update cache
            resolve(p);
        };

        const error = (err) => {
            console.warn(`GPS Error (Code ${err.code}):`, err.message);

            // 1 = PERMISSION_DENIED
            // If denied, we cannot retry. Fail immediately.
            if (err.code === 1) {
                reject(new Error("GPS Permission denied"));
                return;
            }

            // If Timeout (3) or Unavailable (2), we try fallback
            console.log("Retrying with Low Accuracy...");
            navigator.geolocation.getCurrentPosition(
                success,
                (errLow) => {
                    console.warn("Low Accuracy GPS also failed:", errLow);
                    // Final Fallback: Cached Position
                    if (lastPosition) {
                        console.warn("Using last known cached position.");
                        resolve(lastPosition);
                    } else {
                        reject(errLow);
                    }
                },
                {
                    enableHighAccuracy: false, // Low accuracy (WiFi/Cell)
                    timeout: 20000, // 20s for fallback
                    maximumAge: Infinity
                }
            );
        };

        // First Try: High Accuracy
        navigator.geolocation.getCurrentPosition(
            success,
            error,
            {
                enableHighAccuracy: true,
                timeout: 15000, // 15s (Give user time to click Allow on new domain)
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
