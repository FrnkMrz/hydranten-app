import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

export function renderConfirmView() {
  return `
    <div class="h-full w-full bg-slate-900 text-white flex flex-col animate-fade-in pb-safe">
      <!-- Top: Map (Compact Hero 25%) -->
      <div class="relative w-full h-[25vh] bg-gray-800 shrink-0">
        
        <!-- MAIN: Map -->
        <div id="map" class="w-full h-full z-0"></div>

        <!-- OVERLAY: Photo (Thumbnail - Smaller) -->
        <div class="absolute bottom-4 right-4 w-20 h-28 rounded-xl border-2 border-white/30 shadow-2xl overflow-hidden bg-black z-10 transition transform origin-bottom-right hover:scale-[2.5] active:scale-[2.5] cursor-pointer group">
            <img id="preview-img" class="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"></div>
            <span class="absolute bottom-1 right-2 text-[10px] font-bold text-white/80">FOTO</span>
        </div>

        <!-- Back Button (Floating) -->
        <div class="absolute top-4 left-4 z-20">
           <button id="retake-btn" class="bg-black/40 backdrop-blur-md p-3 rounded-full text-white hover:bg-black/60 transition shadow-lg border border-white/10">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
           </button>
        </div>

        <!-- Accuracy Pill & Retry -->
        <div class="absolute top-4 right-4 z-20 flex flex-col items-end gap-2">
           <div class="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-white/90 border border-white/10 shadow-lg" id="geo-status-pill">
              GPS: ...
           </div>
           <button id="gps-retry-btn" class="bg-blue-600/80 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-bold text-white shadow-lg active:scale-95 transition hidden">
              🔄 GPS neu laden
           </button>
        </div>
      </div>

      <!-- Scrollable Form Content -->
      <div class="flex-grow overflow-y-auto px-4 pt-6 pb-24 space-y-8 bg-slate-900">
         
         <!-- Type Selection (Grid) -->
         <div class="space-y-3">
            <h3 class="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Hydranten-Typ</h3>
            <div id="type-grid" class="grid grid-cols-5 gap-2">
               <!-- JS Populated Small Grid -->
            </div>
            <input type="hidden" id="hydrant-type" value="pillar">
         </div>

         <!-- Position Selection -->
         <div class="space-y-3">
             <h3 class="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Lage</h3>
             <div class="grid grid-cols-2 gap-2 bg-gray-800/50 p-1 rounded-xl">
                <button type="button" class="pos-option-btn py-2 px-2 rounded-lg text-gray-400 font-bold transition text-xs flex items-center justify-center gap-1" data-value="sidewalk">
                   🚶 Gehweg
                </button>
                <button type="button" class="pos-option-btn py-2 px-2 rounded-lg text-gray-400 font-bold transition text-xs flex items-center justify-center gap-1" data-value="street">
                   🚗 Straße
                </button>
                <button type="button" class="pos-option-btn py-2 px-2 rounded-lg text-gray-400 font-bold transition text-xs flex items-center justify-center gap-1" data-value="parking_lane">
                   🅿️ Parkbucht
                </button>
                <button type="button" class="pos-option-btn py-2 px-2 rounded-lg text-gray-400 font-bold transition text-xs flex items-center justify-center gap-1" data-value="green">
                   🌳 Grün
                </button>
             </div>
             <input type="hidden" id="hydrant-position" value="sidewalk">
         </div>

         <!-- Details (Visible) -->
         <div class="space-y-4 pt-4 border-t border-gray-800">
            <h3 class="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Technische Daten (Optional)</h3>
            
            <!-- Diameter / Volume -->
            <div id="diameter-container">
                <label class="block text-[10px] uppercase text-gray-500 mb-1 font-bold">Durchmesser</label>
                <select id="hydrant-diameter" class="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white outline-none">
                    <option value="">Nicht angegeben</option>
                    <option value="80">DN 80</option>
                    <option value="100">DN 100</option>
                    <option value="150">DN 150</option>
                    <option value="50">DN 50</option>
                </select>
            </div>

            <div id="volume-container" class="hidden">
                <label class="block text-[10px] uppercase text-gray-500 mb-1 font-bold">Volumen</label>
                <input type="text" id="hydrant-volume" placeholder="z.B. 100m3" class="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white outline-none">
            </div>

            <div class="space-y-4">
               <div>
                  <label class="block text-[10px] uppercase text-gray-500 mb-1 font-bold">Nummer / Ref</label>
                  <input type="text" id="hydrant-ref" placeholder="z.B. 1234" class="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white outline-none">
               </div>
               <div>
                  <label class="block text-[10px] uppercase text-gray-500 mb-1 font-bold">Betreiber</label>
                  <input type="text" id="hydrant-operator" placeholder="Gemeinde" class="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white outline-none">
               </div>
               <div>
                  <label class="block text-[10px] uppercase text-gray-500 mb-1 font-bold">Farbe</label>
                  <input type="text" id="hydrant-colour" placeholder="Rot" class="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white outline-none">
               </div>
               <div>
                  <label class="block text-[10px] uppercase text-gray-500 mb-1 font-bold">Notiz</label>
                  <textarea id="hydrant-note" placeholder="..." class="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white h-20 outline-none"></textarea>
               </div>
            </div>
         </div>
      </div>

      <!-- Submit Footer -->
      <div class="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/90 backdrop-blur-xl border-t border-gray-800/50 z-50 max-w-sm mx-auto">
         <button id="submit-img-btn" class="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-green-900/30 active:scale-95 transition-all flex items-center justify-center gap-2">
            <span>HOCHLADEN ZU OSM ☁️</span>
         </button>
      </div>
    </div>
  `;
}

export function initConfirmView(element, imageBlob, location, onRetake, onSubmit) {
  const img = element.querySelector('#preview-img');
  img.src = URL.createObjectURL(imageBlob);

  const retakeBtn = element.querySelector('#retake-btn');
  const submitBtn = element.querySelector('#submit-img-btn');
  const typeInput = element.querySelector('#hydrant-type');
  const posInput = element.querySelector('#hydrant-position');

  const volumeContainer = element.querySelector('#volume-container');
  const volumeInput = element.querySelector('#hydrant-volume');
  const diameterContainer = element.querySelector('#diameter-container');
  const diameterInput = element.querySelector('#hydrant-diameter');

  // GRID OPTIONS (Emojis preferred by user)
  const options = [
    { id: 'pillar', label: 'Überflur', icon: '<span class="text-2xl">📮</span>' },
    { id: 'underground', label: 'Unterflur', icon: '<span class="text-2xl">🕳️</span>' },
    { id: 'wall', label: 'Wand', icon: '<span class="text-2xl">🧱</span>' },
    { id: 'cistern', label: 'Zisterne', icon: '<span class="text-2xl">💧</span>' },
    { id: 'dry_hydrant', label: 'Trocken', icon: '<span class="text-2xl">🌵</span>' }
  ];

  const grid = element.querySelector('#type-grid');
  grid.innerHTML = options.map(opt => `
     <button type="button" class="option-btn aspect-square rounded-xl border-2 border-transparent bg-gray-800 text-gray-400 hover:bg-gray-700 hover:scale-105 active:scale-95 transition flex flex-col items-center justify-center gap-1" data-value="${opt.id}">
        ${opt.icon}
        <span class="text-[9px] font-bold uppercase tracking-tight">${opt.label}</span>
     </button>
  `).join('');

  // Grid Logic
  const optionBtns = element.querySelectorAll('.option-btn');
  const updateGrid = (val) => {
    typeInput.value = val;
    optionBtns.forEach(btn => {
      if (btn.dataset.value === val) {
        btn.classList.add('border-red-500', 'bg-red-900/30', 'text-white', 'shadow-md', 'shadow-red-900/20');
        btn.classList.remove('border-transparent', 'bg-gray-800', 'text-gray-400');
      } else {
        btn.classList.remove('border-red-500', 'bg-red-900/30', 'text-white', 'shadow-md', 'shadow-red-900/20');
        btn.classList.add('border-transparent', 'bg-gray-800', 'text-gray-400');
      }
    });

    if (val === 'cistern') {
      volumeContainer.classList.remove('hidden');
      diameterContainer.classList.add('hidden');
    } else {
      volumeContainer.classList.add('hidden');
      diameterContainer.classList.remove('hidden');
    }
  };

  element.querySelectorAll('.option-btn').forEach(btn => {
    btn.onclick = () => updateGrid(btn.dataset.value);
  });
  updateGrid('pillar'); // Default

  // Position Logic
  const posBtns = element.querySelectorAll('.pos-option-btn');
  const updatePos = (val) => {
    posInput.value = val;
    posBtns.forEach(btn => {
      if (btn.dataset.value === val) {
        btn.classList.add('bg-blue-600', 'text-white', 'shadow-lg');
        btn.classList.remove('text-gray-400');
      } else {
        btn.classList.remove('bg-blue-600', 'text-white', 'shadow-lg');
        btn.classList.add('text-gray-400');
      }
    });
  };
  posBtns.forEach(btn => {
    btn.onclick = () => updatePos(btn.dataset.value);
  });
  updatePos('sidewalk');


  // Map Setup (Hero)
  const mapContainer = element.querySelector('#map');
  const center = [location.lat || 48.137, location.lng || 11.576]; // Safe Access
  const map = L.map(mapContainer, { zoomControl: false }).setView(center, 19);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: ''
  }).addTo(map);

  const marker = L.marker(center, { draggable: true }).addTo(map);
  const statusPill = document.querySelector('#geo-status-pill');

  marker.on('dragend', function (event) {
    const position = marker.getLatLng();
    location.lat = position.lat;
    location.lng = position.lng;
    if (statusPill) statusPill.innerText = `📍 Verschoben`;
  });

  const accuracy = location.accuracy ? Math.round(location.accuracy) : '?';
  if (statusPill) statusPill.innerText = `GPS: ±${accuracy}m`;

  // Retry Button Logic
  const retryBtn = element.querySelector('#gps-retry-btn');
  if (retryBtn) {
    if (location.accuracy > 500 || location.lat === 48.137) {
      retryBtn.classList.remove('hidden');
      retryBtn.classList.add('animate-pulse');
    }

    retryBtn.onclick = async () => {
      retryBtn.disabled = true;
      retryBtn.innerText = "Lade...";
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
          retryBtn.innerText = "Geladen!";
          setTimeout(() => retryBtn.classList.add('hidden'), 1500);
        } else {
          retryBtn.innerText = "Fehler";
          retryBtn.disabled = false;
        }
      }
    };
  }

  retakeBtn.onclick = () => onRetake.back();

  submitBtn.onclick = () => {
    const selectedType = typeInput.value;
    const selectedPos = posInput.value;

    const tags = {};
    if (selectedType === 'cistern') {
      tags['emergency'] = 'water_tank';
      if (volumeInput.value) tags['water_tank:volume'] = volumeInput.value;
      tags['fire_hydrant:position'] = selectedPos;
    } else if (selectedType === 'dry_hydrant') {
      tags['emergency'] = 'fire_hydrant';
      tags['fire_hydrant:type'] = 'dry_hydrant';
      tags['fire_hydrant:position'] = selectedPos;
    }
    else {
      tags['emergency'] = 'fire_hydrant';
      tags['fire_hydrant:type'] = selectedType;
      tags['fire_hydrant:position'] = selectedPos;
    }

    if (diameterInput.value) tags['fire_hydrant:diameter'] = diameterInput.value;
    const ref = element.querySelector('#hydrant-ref').value;
    if (ref) tags['ref'] = ref;

    const op = element.querySelector('#hydrant-operator').value;
    if (op) tags['operator'] = op;
    const col = element.querySelector('#hydrant-colour').value;
    if (col) tags['colour'] = col;
    const note = element.querySelector('#hydrant-note').value;
    if (note) tags['note'] = note;

    onSubmit({
      ...location,
      tags: tags
    });
  };

  setTimeout(() => map.invalidateSize(), 300);
}
