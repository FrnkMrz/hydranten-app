import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { t } from '../../services/i18n.js';
import { CONSTANTS } from '../../constants.js';

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

    const center = [location.lat || CONSTANTS.DEFAULT_LAT, location.lng || CONSTANTS.DEFAULT_LNG]; // Safe Access

    const map = L.map(mapContainer, {
        zoomControl: false,
        dragging: true, // Always allow dragging to correct position
        touchZoom: true,
        doubleClickZoom: true,
        scrollWheelZoom: true,
        boxZoom: false,
        keyboard: false
    }).setView(center, CONSTANTS.DEFAULT_ZOOM + 1); // 19

    // Max Bounds (approx +/- 0.002 degrees ~ 200 meters)
    // This prevents the user from "losing" the hydrant
    const BOUND_OFFSET = CONSTANTS.OVERPASS_BOUND_PAD * 0.004; // Approx 0.002
    // Actually best to stick to 0.002 as explicit small constraint for this view
    // const BOUND_OFFSET = 0.002;
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

    // Nodes that are part of a way must not move because that would alter the
    // geometry of the entire connected OSM way.
    const marker = L.marker(center, { draggable: !isLocked, autoPan: true }).addTo(map);
    const statusPill = document.querySelector('#geo-status-pill');

    marker.on('dragend', function () {
        const position = marker.getLatLng();
        location.lat = position.lat;
        location.lng = position.lng;
        // Re-render pill text correctly
        // if (statusPill) statusPill.innerText = editMode ? t('confirm.position_moved') : `📍 ${t('confirm.position_moved') || 'Verschoben'}`;

        if (editMode && typeof checkChanges === 'function') checkChanges();
    });

    // Tap to Move (Easy positioning)
    map.on('click', function (e) {
        // Only allow if editable (or confirm view always allows adjustment?)
        // Confirm view allows adjustment too.
        if (isLocked) return;

        marker.setLatLng(e.latlng);

        // Update State
        location.lat = e.latlng.lat;
        location.lng = e.latlng.lng;

        // if (statusPill) statusPill.innerText = editMode ? t('confirm.position_moved') : `📍 ${t('confirm.position_moved') || 'Verschoben'}`;
        if (editMode && typeof checkChanges === 'function') checkChanges();
    });

    // const accuracy = location.accuracy ? Math.round(location.accuracy) : '?';
    if (statusPill && !statusPill.innerText.includes('Verschoben')) {
        // statusPill.innerText = editMode ? t('confirm.fixed_map') : `GPS: ±${accuracy}m`;
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

                    // if (statusPill) statusPill.innerText = `GPS: ±${Math.round(newLoc.accuracy)}m`;
                    retryBtn.innerText = t('general.success') || "Geladen!";
                    setTimeout(() => retryBtn.classList.add('hidden'), 1500);
                } else {
                    retryBtn.innerText = t('general.error') || "Fehler";
                    retryBtn.disabled = false;
                }
            }
        };
    }

    // Fullscreen Toggle Logic
    const expandBtn = element.querySelector('#map-expand-btn');
    const mapParent = mapContainer.parentElement; // The 25vh container

    if (expandBtn) {
        let isExpanded = false;
        expandBtn.onclick = () => {
            isExpanded = !isExpanded;

            if (isExpanded) {
                // Expand
                mapParent.classList.remove('h-[25vh]', 'relative');
                mapParent.classList.add('fixed', 'inset-0', 'z-[60]', 'h-full', 'w-full'); // z-60 to be above everything

                // Update Icon to Minimize
                expandBtn.innerHTML = `<svg aria-hidden="true" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 16h4m0 0v4m-4-4l5 5M15 8h4m0 0V4m0 4l-5-5M15 16h4m0 0v4m-4-4l5 5M5 8h4m0 0V4m0 4l-5-5"></path></svg>`;

                // Allow zooming out more in fullscreen for context
                map.setMinZoom(16);
            } else {
                // Collapse
                mapParent.classList.add('h-[25vh]', 'relative');
                mapParent.classList.remove('fixed', 'inset-0', 'z-[60]', 'h-full', 'w-full');

                // Update Icon to Expand
                expandBtn.innerHTML = `<svg aria-hidden="true" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>`;

                // Reset Zoom Limit
                map.setMinZoom(17);
                map.setZoom(19); // Snap back to close view
            }

            // Critical: Trigger resize so Leaflet knows container changed
            setTimeout(() => {
                map.invalidateSize();
            }, 300); // Wait for transition if any (we don't have CSS transition on height yet but good practice)
        };
    }

    setTimeout(() => map.invalidateSize(), 300);

    return map;
}
