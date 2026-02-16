import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { t } from '../../services/i18n.js';

// Fix Leaflet Icons
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

export function initMap(element, location, editMode, initialData, onRetake, checkChanges) {
    const mapContainer = element.querySelector('#map');
    if (!mapContainer) return;

    const center = [location.lat || 48.137, location.lng || 11.576]; // Safe Access

    const map = L.map(mapContainer, {
        zoomControl: false,
        dragging: true, // Always allow dragging to correct position
        touchZoom: true,
        doubleClickZoom: true,
        scrollWheelZoom: true,
        boxZoom: false,
        keyboard: false
    }).setView(center, 19);

    // Max Bounds (approx +/- 0.002 degrees ~ 200 meters)
    // This prevents the user from "losing" the hydrant
    const BOUND_OFFSET = 0.002;
    map.setMaxBounds([
        [center[0] - BOUND_OFFSET, center[1] - BOUND_OFFSET], // SouthWest
        [center[0] + BOUND_OFFSET, center[1] + BOUND_OFFSET]  // NorthEast
    ]);
    map.setMinZoom(17); // Don't allow zooming out too far

    const isLocked = editMode && initialData && initialData._isPartOfWay;

    // Dynamic Tile Layer
    const style = localStorage.getItem('map_style') || 'osm';
    let tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    let attribution = '';
    let maxNativeZoom = 19;

    if (style === 'satellite') {
        tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
        attribution = 'Tiles &copy; Esri';
    } else if (style === 'topo') {
        tileUrl = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
        attribution = 'Map style: &copy; OpenTopoMap';
        maxNativeZoom = 16;
    }

    L.tileLayer(tileUrl, {
        attribution: attribution,
        maxZoom: 19,
        maxNativeZoom: maxNativeZoom
    }).addTo(map);

    // Disable dragging if locked -> Now always draggable but restricted by map bounds
    const marker = L.marker(center, { draggable: true, autoPan: true }).addTo(map);
    const statusPill = document.querySelector('#geo-status-pill');

    marker.on('dragend', function (event) {
        const position = marker.getLatLng();
        location.lat = position.lat;
        location.lng = position.lng;
        // Re-render pill text correctly
        if (statusPill) statusPill.innerText = editMode ? t('confirm.position_moved') : `📍 ${t('confirm.position_moved') || 'Verschoben'}`;

        if (editMode && typeof checkChanges === 'function') checkChanges();
    });

    const accuracy = location.accuracy ? Math.round(location.accuracy) : '?';
    if (statusPill && !statusPill.innerText.includes('Verschoben')) {
        statusPill.innerText = editMode ? t('confirm.fixed_map') : `GPS: ±${accuracy}m`;
    }

    // Retry Button Logic
    const retryBtn = element.querySelector('#gps-retry-btn');
    if (retryBtn && !editMode) {
        if (location.accuracy > 500 || location.lat === 48.137) {
            retryBtn.classList.remove('hidden');
            retryBtn.classList.add('animate-pulse');
        }

        retryBtn.onclick = async () => {
            retryBtn.disabled = true;
            retryBtn.innerText = t('general.loading') || "Lade...";
            retryBtn.classList.remove('animate-pulse');

            if (onRetake && onRetake.retryGPS) {
                const newLoc = await onRetake.retryGPS();
                if (newLoc) {
                    location.lat = newLoc.lat;
                    location.lng = newLoc.lng;
                    location.accuracy = newLoc.accuracy;

                    // Update Map
                    map.setView([newLoc.lat, newLoc.lng], 19);
                    marker.setLatLng([newLoc.lat, newLoc.lng]);

                    if (statusPill) statusPill.innerText = `GPS: ±${Math.round(newLoc.accuracy)}m`;
                    retryBtn.innerText = t('general.success') || "Geladen!";
                    setTimeout(() => retryBtn.classList.add('hidden'), 1500);
                } else {
                    retryBtn.innerText = t('general.error') || "Fehler";
                    retryBtn.disabled = false;
                }
            }
        };
    }

    setTimeout(() => map.invalidateSize(), 300);

    return map;
}
