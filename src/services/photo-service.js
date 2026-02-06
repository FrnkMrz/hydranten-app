import piexif from 'piexifjs';

/**
 * Convert decimal degrees to GPS rational format (DMS - Degrees/Minutes/Seconds)
 * EXIF GPS requires [[degrees, 1], [minutes, 1], [seconds, 100]]
 * @param {number} deg - Decimal degrees (e.g., 48.1234)
 * @returns {Array} GPS rational format
 */
function degToRational(deg) {
    const absDeg = Math.abs(deg);
    const degrees = Math.floor(absDeg);
    const minutesFloat = (absDeg - degrees) * 60;
    const minutes = Math.floor(minutesFloat);
    const secondsFloat = (minutesFloat - minutes) * 60;
    const seconds = Math.round(secondsFloat * 100); // Precision auf 2 Dezimalstellen

    return [
        [degrees, 1],
        [minutes, 1],
        [seconds, 100]
    ];
}

/**
 * Add GPS EXIF data to a JPEG image blob
 * @param {Blob} imageBlob - Original image blob
 * @param {number} lat - Latitude in decimal degrees
 * @param {number} lng - Longitude in decimal degrees
 * @returns {Promise<Blob>} New blob with EXIF data
 */
export async function addExifGpsData(imageBlob, lat, lng) {
    try {
        // Convert blob to base64 data URL (required by piexifjs)
        const reader = new FileReader();
        const dataUrl = await new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(imageBlob);
        });

        // Load existing EXIF (if any)
        let exifObj = {};
        try {
            exifObj = piexif.load(dataUrl);
        } catch (e) {
            // No EXIF data present, start fresh
            console.log('No existing EXIF data, creating new structure');
            exifObj = { "0th": {}, "Exif": {}, "GPS": {}, "Interop": {}, "1st": {}, "thumbnail": null };
        }

        // Ensure GPS object exists
        if (!exifObj.GPS) exifObj.GPS = {};

        // Convert coordinates to GPS format
        const latRational = degToRational(lat);
        const lngRational = degToRational(lng);

        // Set GPS tags
        exifObj.GPS[piexif.GPSIFD.GPSLatitude] = latRational;
        exifObj.GPS[piexif.GPSIFD.GPSLatitudeRef] = lat >= 0 ? 'N' : 'S';
        exifObj.GPS[piexif.GPSIFD.GPSLongitude] = lngRational;
        exifObj.GPS[piexif.GPSIFD.GPSLongitudeRef] = lng >= 0 ? 'E' : 'W';

        // Optional: Add timestamp
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0].replace(/-/g, ':');
        const timeStr = now.toISOString().split('T')[1].split('.')[0];
        exifObj.GPS[piexif.GPSIFD.GPSDateStamp] = dateStr;
        exifObj.GPS[piexif.GPSIFD.GPSTimeStamp] = timeStr.split(':').map(v => [parseInt(v), 1]);

        // Dump EXIF to binary
        const exifBytes = piexif.dump(exifObj);

        // Insert EXIF into image
        const newDataUrl = piexif.insert(exifBytes, dataUrl);

        // Convert back to blob
        const response = await fetch(newDataUrl);
        const newBlob = await response.blob();

        console.log(`✅ EXIF GPS added: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        return newBlob;

    } catch (error) {
        console.error('Failed to add EXIF GPS data:', error);
        // Fallback: Return original blob if EXIF fails
        return imageBlob;
    }
}

/**
 * Generate descriptive filename based on location and hydrant type
 * @param {Object} location - Location object with lat, lng
 * @param {Object} tags - Hydrant tags (type, etc.)
 * @returns {Promise<string>} Filename (e.g., "91220_Schnaittach_Hauptstrasse_Hydrant.jpg")
 */
export async function generateFilename(location, tags = {}) {
    try {
        // Try to reverse geocode
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}&zoom=18&addressdetails=1`,
            {
                headers: {
                    'User-Agent': 'Hydranten-Jaeger-App/1.3.3'
                }
            }
        );

        if (response.ok) {
            const data = await response.json();
            const addr = data.address || {};

            // Extract components
            const zip = addr.postcode || '';
            const city = addr.city || addr.town || addr.village || addr.municipality || '';
            const street = (addr.road || addr.pedestrian || addr.footway || addr.path || '').replace(/\s+/g, '_');

            // Determine type label
            let typeLabel = 'Hydrant';
            if (tags.emergency === 'water_tank') typeLabel = 'Zisterne';
            else if (tags.emergency === 'suction_point') typeLabel = 'Saugstelle';

            // Build filename
            if (zip && city && street) {
                return `${zip}_${city}_${street}_${typeLabel}.jpg`;
            } else if (zip && city) {
                return `${zip}_${city}_${typeLabel}.jpg`;
            } else if (city) {
                return `${city}_${typeLabel}.jpg`;
            }
        }
    } catch (error) {
        console.warn('Nominatim geocoding failed, using coordinate fallback:', error);
    }

    // Fallback: Use coordinates
    const latStr = location.lat.toFixed(4).replace('.', '_');
    const lngStr = location.lng.toFixed(4).replace('.', '_');
    return `Hydrant_${latStr}_${lngStr}.jpg`;
}
