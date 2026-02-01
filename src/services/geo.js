import * as Geolib from 'geolib';

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
            maximumAge: 10000,
            timeout: 20000
        }
    );
}

export function updatePosition(pos) {
    lastPosition = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        heading: pos.coords.heading,
        timestamp: Date.now()
    };
    localStorage.setItem('last_known_pos', JSON.stringify(lastPosition));
}

export function getLastKnownPosition() {
    return lastPosition;
}

export async function getPosition() {
    // Return cached position if fresh (< 20s old)
    if (lastPosition && (Date.now() - lastPosition.timestamp < 20000)) {
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

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const p = {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                    heading: pos.coords.heading
                };
                lastPosition = { ...p, timestamp: Date.now() }; // Update cache
                resolve(p);
            },
            (err) => {
                // If current check fails but we have an old cached one, use it!
                if (lastPosition) {
                    console.warn("Fresh GPS failed, using cached:", err);
                    resolve(lastPosition);
                } else {
                    reject(err);
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 5000, // Short timeout because we prefer cache over waiting too long
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
