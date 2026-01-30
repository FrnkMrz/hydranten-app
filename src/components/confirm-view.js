import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for Leaflet default icon issues in Vite/Webpack
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

export function renderConfirmView() {
    return `
    <div class="flex flex-col h-full w-full bg-slate-900 text-white overflow-y-auto pb-10">
      
      <!-- Image Preview -->
      <div class="relative w-full h-64 shrink-0 bg-black">
        <img id="preview-img" class="w-full h-full object-cover opacity-80" />
        <button id="retake-btn" class="absolute top-4 left-4 bg-black/50 p-2 rounded-full text-white backdrop-blur-sm">
           ⬅ Zurück
        </button>
      </div>

      <!-- Map Section -->
      <div class="p-4 space-y-4">
         <h2 class="text-xl font-bold">Standort bestätigen</h2>
         <div id="map" class="w-full h-48 rounded-xl bg-gray-800 border border-gray-700 z-0"></div>
         <p id="geo-status" class="text-sm text-gray-400">Suche Standort...</p>
      </div>

      <!-- Form Section -->
      <div class="p-4 space-y-4 bg-slate-800/50 m-4 rounded-xl border border-slate-700">
         <h2 class="text-xl font-bold">Details</h2>
         
         <label class="block">
           <span class="text-gray-400 text-sm">Typ</span>
           <select id="hydrant-type" class="block w-full mt-1 bg-slate-700 border-none rounded-lg p-3 focus:ring-2 focus:ring-red-500">
             <option value="pillar">Überflurhydrant</option>
             <option value="underground">Unterflurhydrant</option>
             <option value="wall">Wandhydrant</option>
           </select>
         </label>

         <!-- Mock AI Suggestion -->
         <div id="ai-suggestion" class="hidden p-3 bg-blue-900/30 border border-blue-500/30 rounded-lg text-sm text-blue-200">
           🤖 AI Vorschlag: <span id="ai-type" class="font-bold">...</span>
         </div>
      </div>

      <!-- Actions -->
      <div class="p-4 mt-auto">
        <button id="submit-img-btn" class="w-full py-4 bg-red-600 hover:bg-red-700 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-all flex justify-center items-center gap-2">
           <span>Hochladen</span>
           <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
        </button>
      </div>
    </div>
  `;
}

export function initConfirmView(element, imageBlob, locationData, onRetake, onSubmit) {
    // Setup Image
    const img = element.querySelector('#preview-img');
    img.src = URL.createObjectURL(imageBlob);

    // Setup Map
    const mapContainer = element.querySelector('#map');
    const map = L.map(mapContainer).setView([locationData.lat, locationData.lng], 18);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OSM Contributors'
    }).addTo(map);

    const marker = L.marker([locationData.lat, locationData.lng], { draggable: true }).addTo(map);

    // Update loc on drag
    marker.on('dragend', function (event) {
        const position = marker.getLatLng();
        marker.setLatLng(position, { draggable: true }).bindPopup(position).update();
        locationData.lat = position.lat;
        locationData.lng = position.lng;
        document.querySelector('#geo-status').innerText = `Manuell korrigiert: ${position.lat.toFixed(5)}, ${position.lng.toFixed(5)}`;
    });

    document.querySelector('#geo-status').innerText = `Genauigkeit: ${Math.round(locationData.accuracy)}m`;

    // Retake
    element.querySelector('#retake-btn').onclick = onRetake;

    // Submit
    element.querySelector('#submit-img-btn').onclick = () => {
        const type = element.querySelector('#hydrant-type').value;
        onSubmit({
            ...locationData,
            type
        });
    };

    // Force Map Resize after render
    setTimeout(() => {
        map.invalidateSize();
    }, 200);
}
