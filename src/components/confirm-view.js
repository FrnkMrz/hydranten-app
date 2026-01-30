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
         <div id="map" class="w-full h-48 rounded-xl bg-gray-800 border border-gray-700 relative z-10 shadow-inner overflow-hidden"></div>
         <p id="geo-status" class="text-xs text-gray-400 text-right">Suche Standort...</p>
      </div>

      <!-- Form Section -->
      <div class="px-4 pb-4 space-y-4">
         <div class="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50 space-y-6">
           <h2 class="text-lg font-bold flex items-center gap-2">ℹ️ Hydranten Details</h2>
           
           <!-- TYPE GRID -->
           <div>
             <span class="text-xs text-gray-400 uppercase font-bold tracking-wider block mb-2">Typ *</span>
             <div class="grid grid-cols-3 gap-2" id="type-grid">
                ${renderOptionBtn('type', 'pillar', '📮', 'Überflur')}
                ${renderOptionBtn('type', 'underground', '🕳️', 'Unterflur')}
                ${renderOptionBtn('type', 'wall', '🧱', 'Wand')}
                ${renderOptionBtn('type', 'pond', '🌊', 'Teich')}
                ${renderOptionBtn('type', 'cistern', '💧', 'Zisterne')}
             </div>
             <input type="hidden" id="hydrant-type" value="" />
           </div>

           <!-- POSITION GRID -->
           <div>
             <span class="text-xs text-gray-400 uppercase font-bold tracking-wider block mb-2">Position *</span>
             <div class="grid grid-cols-3 gap-2" id="position-grid">
                ${renderOptionBtn('pos', 'sidewalk', '🚶', 'Gehweg')}
                ${renderOptionBtn('pos', 'lane', '🚗', 'Straße')}
                ${renderOptionBtn('pos', 'parking_lot', '🅿️', 'Parkplatz')}
                ${renderOptionBtn('pos', 'green', '🌳', 'Grün')}
                ${renderOptionBtn('pos', 'surface', '⏹️', 'Platz')}
             </div>
             <input type="hidden" id="hydrant-position" value="" />
           </div>

            <!-- VOLUME (Conditional for Cistern) -->
           <div id="volume-container" class="hidden animate-fade-in">
             <label class="block">
               <span class="text-xs text-gray-400 uppercase font-bold tracking-wider">Volumen (m³) *</span>
               <input type="number" id="hydrant-volume" placeholder="z.B. 50" class="w-full bg-gray-900 p-3 rounded-lg mt-1 border border-gray-700 focus:border-blue-500 outline-none transition" />
             </label>
           </div>

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

function renderOptionBtn(group, value, icon, label) {
  return `
    <button type="button" data-group="${group}" data-value="${value}" class="option-btn flex flex-col items-center justify-center p-3 rounded-xl bg-gray-800 border border-gray-700 hover:bg-gray-700 active:scale-95 transition-all">
       <span class="text-2xl mb-1">${icon}</span>
       <span class="text-[10px] font-bold uppercase tracking-wide text-gray-400">${label}</span>
    </button>
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

  // UI References
  const submitBtn = element.querySelector('#submit-img-btn');
  const typeInput = element.querySelector('#hydrant-type');
  const posInput = element.querySelector('#hydrant-position');
  const volumeContainer = element.querySelector('#volume-container');
  const volumeInput = element.querySelector('#hydrant-volume');

  // Logic: Handle Grid Selection
  const optionBtns = element.querySelectorAll('.option-btn');
  optionBtns.forEach(btn => {
    btn.onclick = () => {
      const group = btn.dataset.group;
      const value = btn.dataset.value;

      // Update hidden input
      if (group === 'type') typeInput.value = value;
      if (group === 'pos') posInput.value = value;

      // Update Visuals (Radio behavior)
      element.querySelectorAll(`.option-btn[data-group="${group}"]`).forEach(b => {
        b.classList.remove('bg-red-600', 'border-red-500', 'ring-2', 'ring-red-500/50');
        b.classList.add('bg-gray-800', 'border-gray-700');
        b.querySelector('span:last-child').classList.add('text-gray-400');
        b.querySelector('span:last-child').classList.remove('text-white');
      });

      btn.classList.remove('bg-gray-800', 'border-gray-700');
      btn.classList.add('bg-red-600', 'border-red-500', 'ring-2', 'ring-red-500/50');
      btn.querySelector('span:last-child').classList.remove('text-gray-400');
      btn.querySelector('span:last-child').classList.add('text-white');

      validate();
    };
  });

  const validate = () => {
    const type = typeInput.value;
    const pos = posInput.value;
    let valid = type && pos;

    // Logic: Toggle Volume Field
    if (type === 'cistern') {
      volumeContainer.classList.remove('hidden');
      if (!volumeInput.value) valid = false; // Require volume for cisterns? User said "dort wird es Volumen mit anzugeben sein" (There volume WILL have to be specified). Try to enforce it.
    } else {
      volumeContainer.classList.add('hidden');
    }

    if (valid) {
      submitBtn.disabled = false;
      submitBtn.innerText = "Hochladen";
    } else {
      submitBtn.disabled = true;
      submitBtn.innerText = "Bitte Felder ausfüllen";
    }
  };

  volumeInput.oninput = validate;

  // Initial validate
  validate();

  // Retake
  element.querySelector('#retake-btn').onclick = onRetake;

  // Submit
  submitBtn.onclick = () => {
    const type = typeInput.value;
    const position = posInput.value;
    const diameter = element.querySelector('#hydrant-diameter').value;
    const ref = element.querySelector('#hydrant-ref').value;
    const operator = element.querySelector('#hydrant-operator').value;
    const colour = element.querySelector('#hydrant-colour').value;
    const note = element.querySelector('#hydrant-note').value;
    const volume = volumeInput.value;

    // Construct OSM Tags
    const tags = {};

    if (type === 'cistern') {
      tags['emergency'] = 'water_tank';
      tags['water_tank:volume'] = volume;
      // Usually cisterns don't have fire_hydrant:type, but we can keep position as generic or fire_hydrant:position
      tags['fire_hydrant:position'] = position;
    } else {
      tags['emergency'] = 'fire_hydrant';
      tags['fire_hydrant:type'] = type;
      tags['fire_hydrant:position'] = position;
    }

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
