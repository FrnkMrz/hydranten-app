export function renderConfirmView() {
  return `
    <div class="h-full w-full bg-slate-900 text-white flex flex-col animate-fade-in pb-safe">
      <!-- Image Preview Header -->
      <div class="relative w-full h-[40vh] bg-black shrink-0">
        <img id="preview-img" class="w-full h-full object-cover shadow-lg opacity-90" />
        
        <div class="absolute top-4 left-4">
           <button id="retake-btn" class="bg-black/50 backdrop-blur-md p-2 rounded-full text-white hover:bg-black/70 transition">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
           </button>
        </div>
        
        <!-- Map Overlay (Mini Map) -->
        <div class="absolute -bottom-10 right-4 w-24 h-24 rounded-2xl border-4 border-slate-700 shadow-xl overflow-hidden bg-gray-800 z-20">
           <div id="mini-map" class="w-full h-full"></div>
        </div>
      </div>

      <!-- Scrollable Form Content -->
      <div class="flex-grow overflow-y-auto pt-12 px-6 pb-24 space-y-6">
         
         <!-- Type Selection (Grid) -->
         <div class="space-y-4">
            <h3 class="text-sm font-bold uppercase tracking-widest text-gray-400">Typ</h3>
            <div id="type-grid" class="grid grid-cols-4 gap-3">
               <!-- JS Populated -->
            </div>
            <input type="hidden" id="hydrant-type" value="pillar">
         </div>

         <!-- Position Selection -->
         <div class="space-y-4">
             <h3 class="text-sm font-bold uppercase tracking-widest text-gray-400">Lage</h3>
             <div class="flex gap-4">
                <button type="button" class="pos-option-btn flex-1 py-3 px-4 rounded-xl border-2 border-transparent bg-gray-800 text-gray-400 font-bold transition text-sm" data-value="sidewalk">
                   Gehweg
                </button>
                <button type="button" class="pos-option-btn flex-1 py-3 px-4 rounded-xl border-2 border-transparent bg-gray-800 text-gray-400 font-bold transition text-sm" data-value="street">
                   Straße
                </button>
                <button type="button" class="pos-option-btn flex-1 py-3 px-4 rounded-xl border-2 border-transparent bg-gray-800 text-gray-400 font-bold transition text-sm" data-value="green">
                   Grünfläche
                </button>
             </div>
             <input type="hidden" id="hydrant-position" value="sidewalk">
         </div>

         <!-- Details (Diameter / Volume) -->
         <div class="space-y-4">
             <h3 class="text-sm font-bold uppercase tracking-widest text-gray-400">Details</h3>
             
             <!-- Diameter (hidden for cistern) -->
             <div id="diameter-container">
                 <label class="block text-xs text-gray-500 mb-1">Durchmesser (mm)</label>
                 <select id="hydrant-diameter" class="w-full bg-gray-800 border-none rounded-xl p-3 text-white font-bold focus:ring-2 focus:ring-red-500">
                    <option value="80">80 mm (Standard)</option>
                    <option value="100">100 mm</option>
                    <option value="150">150 mm</option>
                    <option value="50">50 mm (Klein)</option>
                 </select>
             </div>

             <!-- NEW: Volume (hidden by default, shown for Cistern) -->
             <div id="volume-container" class="hidden">
                 <label class="block text-xs text-gray-500 mb-1">Fassungsvermögen (m³ / Liter)</label>
                 <input type="text" id="hydrant-volume" placeholder="z.B. 100m3" class="w-full bg-gray-800 border-none rounded-xl p-3 text-white font-bold focus:ring-2 focus:ring-red-500">
             </div>
         </div>

         <!-- Extra Fields (Collapsible) -->
         <details class="group bg-gray-800/50 rounded-xl p-4">
            <summary class="list-none flex justify-between items-center font-bold cursor-pointer text-gray-400">
               <span>Zusätzliche Infos</span>
               <span class="transition group-open:rotate-180">▼</span>
            </summary>
            <div class="mt-4 space-y-4 text-sm">
               <div>
                  <label class="block text-xs text-gray-500 mb-1">Ref / Nummer</label>
                  <input type="text" id="hydrant-ref" placeholder="H 123" class="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white">
               </div>
               <div>
                  <label class="block text-xs text-gray-500 mb-1">Betreiber</label>
                  <input type="text" id="hydrant-operator" placeholder="Gemeinde..." class="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white">
               </div>
               <div>
                  <label class="block text-xs text-gray-500 mb-1">Farbe</label>
                  <input type="text" id="hydrant-colour" placeholder="Rot" class="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white">
               </div>
               <div>
                  <label class="block text-xs text-gray-500 mb-1">Notiz</label>
                  <textarea id="hydrant-note" placeholder="..." class="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white h-20"></textarea>
               </div>
            </div>
         </details>
      </div>

      <!-- Submit Footer -->
      <div class="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/80 backdrop-blur-lg border-t border-gray-800 z-50 max-w-sm mx-auto">
         <button id="submit-img-btn" class="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-green-900/20 active:scale-95 transition-all flex items-center justify-center gap-2">
            <span>SPEICHERN</span>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
         </button>
      </div>
    </div>
  `;
}

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

  const refInput = element.querySelector('#hydrant-ref');
  const operatorInput = element.querySelector('#hydrant-operator');
  const colourInput = element.querySelector('#hydrant-colour');
  const noteInput = element.querySelector('#hydrant-note');


  // GRID OPTIONS (Updated with Light Mode Colors if needed, but SVGs are generic)
  const options = [
    { id: 'pillar', label: 'Überflur', icon: '<svg class="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2v20m-4-6h8m-8-8h8m-4-4h.01"></path></svg>' },
    { id: 'underground', label: 'Unterflur', icon: '<svg class="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v8m-4-4h8"></path></svg>' },
    { id: 'wall', label: 'Wand', icon: '<svg class="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4h16v16H4zM12 12h.01"></path></svg>' },
    { id: 'cistern', label: 'Zisterne', icon: '<svg class="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12a8 8 0 11-16 0 8 8 0 0116 0z M12 16v-4m0-4h.01"></path></svg>' },
    { id: 'dry_hydrant', label: 'Trocken', icon: '<svg class="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>' }
  ];

  const grid = element.querySelector('#type-grid');
  grid.innerHTML = options.map(opt => `
     <button type="button" class="option-btn p-3 rounded-xl border-2 border-transparent bg-gray-800 text-gray-400 hover:bg-gray-700 transition flex flex-col items-center gap-2" data-value="${opt.id}">
        ${opt.icon}
        <span class="text-xs font-bold">${opt.label}</span>
     </button>
  `).join('');

  // Grid Selection Logic
  const optionBtns = element.querySelectorAll('.option-btn');
  const updateGrid = (val) => {
    typeInput.value = val;
    optionBtns.forEach(btn => {
      if (btn.dataset.value === val) {
        btn.classList.add('border-red-500', 'bg-red-900/40', 'text-white');
        btn.classList.remove('border-transparent', 'bg-gray-800', 'text-gray-400');
      } else {
        btn.classList.remove('border-red-500', 'bg-red-900/40', 'text-white');
        btn.classList.add('border-transparent', 'bg-gray-800', 'text-gray-400');
      }
    });

    // Toggle Fields based on Type
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
  // Init default
  updateGrid('pillar');

  // Position Buttons
  const posBtns = element.querySelectorAll('.pos-option-btn');
  const updatePos = (val) => {
    posInput.value = val;
    posBtns.forEach(btn => {
      if (btn.dataset.value === val) {
        btn.classList.add('border-blue-500', 'bg-blue-900/40', 'text-white');
        btn.classList.remove('border-transparent', 'bg-gray-800', 'text-gray-400');
      } else {
        btn.classList.remove('border-blue-500', 'bg-blue-900/40', 'text-white');
        btn.classList.add('border-transparent', 'bg-gray-800', 'text-gray-400');
      }
    });
  };
  posBtns.forEach(btn => {
    btn.onclick = () => updatePos(btn.dataset.value);
  });
  updatePos('sidewalk');


  // Mini Map
  const mapContainer = element.querySelector('#mini-map');
  const center = [location.lat, location.lng];
  const map = L.map(mapContainer, {
    zoomControl: false, attributionControl: false, dragging: false, scrollWheelZoom: false, doubleClickZoom: false
  }).setView(center, 18);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
  L.marker(center).addTo(map);

  retakeBtn.onclick = onRetake;

  // Submit
  submitBtn.onclick = () => {
    const selectedType = typeInput.value;
    const selectedPos = posInput.value;

    // Construct OSM Tags
    const tags = {};

    if (selectedType === 'cistern') {
      tags['emergency'] = 'water_tank';
      if (volumeInput.value) tags['water_tank:volume'] = volumeInput.value;
      tags['fire_hydrant:position'] = selectedPos;
    } else if (selectedType === 'dry_hydrant') {
      tags['emergency'] = 'fire_hydrant'; // Or emergency=suction_point
      tags['fire_hydrant:type'] = 'dry_hydrant';
      tags['fire_hydrant:position'] = selectedPos;
    }
    else {
      tags['emergency'] = 'fire_hydrant';
      tags['fire_hydrant:type'] = selectedType;
      tags['fire_hydrant:position'] = selectedPos;
    }

    const diameter = diameterInput.value;
    if (diameter) tags['fire_hydrant:diameter'] = diameter;

    const ref = refInput.value;
    if (ref) tags['ref'] = ref;

    const operator = operatorInput.value;
    if (operator) tags['operator'] = operator;

    const colour = colourInput.value;
    if (colour) tags['colour'] = colour;

    const note = noteInput.value;
    if (note) tags['note'] = note;

    // Submit payload
    const data = {
      ...location,
      tags: tags
    };

    onSubmit(data);
  };
}
