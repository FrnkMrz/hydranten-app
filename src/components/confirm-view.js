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
        <button id="retake-btn" class="absolute top-4 left-4 bg-black/50 p-2 rounded-full text-white backdrop-blur-sm shadow-md">
           ⬅ Zurück
        </button>
      </div>

      <!-- Map Section -->
      <div class="p-4 space-y-2">
         <h2 class="text-lg font-bold flex items-center gap-2">
            📍 Standort bestätigen
         </h2>
         <div id="map" class="w-full h-48 rounded-xl bg-gray-800 border border-gray-700 z-0 shadow-inner"></div>
         <p id="geo-status" class="text-xs text-gray-400 text-right">Suche Standort...</p>
      </div>

      <!-- Form Section -->
      <div class="px-4 pb-4 space-y-4">
         <div class="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50 space-y-4">
           <h2 class="text-lg font-bold flex items-center gap-2">ℹ️ Hydranten Details</h2>
           
           <!-- TYPE -->
           <label class="block">
             <span class="text-xs text-gray-400 uppercase font-bold tracking-wider">Typ *</span>
             <select id="hydrant-type" class="w-full bg-gray-900 p-3 rounded-lg mt-1 border border-gray-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition">
               <option value="" disabled selected>Bitte wählen...</option>
               <option value="pillar">Überflurhydrant (Pillar)</option>
               <option value="underground">Unterflurhydrant (Underground)</option>
               <option value="wall">Wandhydrant (Wall)</option>
               <option value="pond">Löschteich (Pond)</option>
             </select>
           </label>

           <!-- POSITION -->
           <label class="block">
             <span class="text-xs text-gray-400 uppercase font-bold tracking-wider">Position *</span>
             <select id="hydrant-position" class="w-full bg-gray-900 p-3 rounded-lg mt-1 border border-gray-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition">
               <option value="" disabled selected>Bitte wählen...</option>
               <option value="sidewalk">Gehweg</option>
               <option value="lane">Straße / Fahrbahn</option>
               <option value="parking_lot">Parkplatz</option>
               <option value="green">Grünstreifen / Wiese</option>
               <option value="surface">Platz / Fläche</option>
             </select>
           </label>

            <!-- DIAMETER (Optional) -->
           <label class="block">
             <span class="text-xs text-gray-400 uppercase font-bold tracking-wider">Durchmesser (mm)</span>
             <input type="number" id="hydrant-diameter" placeholder="z.B. 80, 100" class="w-full bg-gray-900 p-3 rounded-lg mt-1 border border-gray-700 focus:border-red-500 outline-none transition" />
           </label>

           <!-- REF (Optional) -->
           <label class="block">
             <span class="text-xs text-gray-400 uppercase font-bold tracking-wider">Ref-ID (Schild)</span>
             <input type="text" id="hydrant-ref" placeholder="Kennzeichnung" class="w-full bg-gray-900 p-3 rounded-lg mt-1 border border-gray-700 focus:border-red-500 outline-none transition" />
           </label>

           <!-- EXTRA FIELDS -->
           <label class="block">
             <span class="text-xs text-gray-400 uppercase font-bold tracking-wider">Betreiber (Operator)</span>
             <input type="text" id="hydrant-operator" placeholder="z.B. Stadtwerke" class="w-full bg-gray-900 p-3 rounded-lg mt-1 border border-gray-700 focus:border-red-500 outline-none transition" />
           </label>
           
           <label class="block">
             <span class="text-xs text-gray-400 uppercase font-bold tracking-wider">Farbe (Colour)</span>
             <input type="text" id="hydrant-colour" placeholder="z.B. red, yellow" class="w-full bg-gray-900 p-3 rounded-lg mt-1 border border-gray-700 focus:border-red-500 outline-none transition" />
           </label>
           
           <label class="block">
             <span class="text-xs text-gray-400 uppercase font-bold tracking-wider">Notiz</span>
             <textarea id="hydrant-note" rows="2" placeholder="Besonderheiten..." class="w-full bg-gray-900 p-3 rounded-lg mt-1 border border-gray-700 focus:border-red-500 outline-none transition"></textarea>
           </label>
         </div>

         <!-- AI Mock Hint -->
         <div id="ai-suggestion" class="hidden p-3 bg-blue-900/20 border border-blue-500/20 rounded-lg text-xs text-blue-300 flex items-start gap-2">
           <span>🤖</span>
           <span>AI Vorschlag: <span id="ai-type" class="font-bold">...</span></span>
         </div>
      </div>

      <!-- Actions -->
      <div class="p-4 mt-auto">
        <button id="submit-img-btn" class="w-full py-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:grayscale rounded-xl font-bold text-lg shadow-lg shadow-red-900/20 active:scale-95 transition-all flex justify-center items-center gap-2">
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
  const map = L.map(mapContainer).setView([locationData.lat, locationData.lng], 19);

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
    document.querySelector('#geo-status').innerText = `Manuell verschoben`;
  });

  document.querySelector('#geo-status').innerText = `Genauigkeit: ${Math.round(locationData.accuracy)}m`;

  // Validation Logic
  const submitBtn = element.querySelector('#submit-img-btn');
  const typeSelect = element.querySelector('#hydrant-type');
  const posSelect = element.querySelector('#hydrant-position');

  const validate = () => {
    const typeValid = typeSelect.value !== "";
    const posValid = posSelect.value !== "";

    if (typeValid && posValid) {
      submitBtn.disabled = false;
      submitBtn.innerText = "Hochladen";
    } else {
      submitBtn.disabled = true;
      submitBtn.innerText = "Bitte Felder ausfüllen";
    }
  };

  // Initial validate
  validate();
  typeSelect.onchange = validate;
  posSelect.onchange = validate;

  // Retake
  element.querySelector('#retake-btn').onclick = onRetake;

  // Submit
  submitBtn.onclick = () => {
    const type = typeSelect.value;
    const position = posSelect.value;
    const diameter = element.querySelector('#hydrant-diameter').value;
    const ref = element.querySelector('#hydrant-ref').value;
    const operator = element.querySelector('#hydrant-operator').value;
    const colour = element.querySelector('#hydrant-colour').value;
    const note = element.querySelector('#hydrant-note').value;

    // Construct OSM Tags
    const tags = {
      'emergency': 'fire_hydrant',
      'fire_hydrant:type': type,
      'fire_hydrant:position': position
    };

    if (diameter) tags['fire_hydrant:diameter'] = diameter;
    if (ref) tags['ref'] = ref;
    if (operator) tags['operator'] = operator;
    if (colour) tags['colour'] = colour;
    if (note) tags['note'] = note;

    onSubmit({
      lat: locationData.lat,
      lng: locationData.lng,
      tags: tags
    });
  };

  // Force Map Resize after render
  setTimeout(() => {
    map.invalidateSize();
  }, 200);
}
