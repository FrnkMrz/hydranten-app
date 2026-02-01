import { t } from '../services/i18n.js';
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

export function renderConfirmView(initialType = 'underground', initialLocation = 'sidewalk') {
  return `
      <div class="h-full w-full bg-black text-white flex flex-col">
        <!-- Map Preview (Fixed Height) -->
        <div class="h-1/3 w-full relative z-0">
           <div id="confirm-map" class="w-full h-full grayscale-[50%]"></div>
           <!-- Pin Overlay -->
           <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -mt-4 text-red-600 drop-shadow-lg z-20 pointer-events-none">
                <svg class="w-10 h-10 filter drop-shadow-md" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
           </div>
           
           <!-- Back Button Overlay -->
           <button id="confirm-back-btn" class="absolute top-4 left-4 z-30 bg-black/50 p-2 rounded-full text-white backdrop-blur-md">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
           </button>
        </div>

        <!-- Scrollable Form (Bottom 2/3) -->
        <div class="flex-grow flex flex-col px-6 pt-6 pb-24 bg-black z-10 rounded-t-3xl -mt-6 shadow-[0_-5px_15px_rgba(255,0,0,0.1)] overflow-y-auto">
            
            <h2 class="text-2xl font-bold mb-6 text-center">${t('confirm.title')}</h2>

            <!-- Form -->
            <div class="space-y-6">
                
                <!-- Type Selection -->
                <div>
                   <label class="text-gray-400 text-xs font-bold uppercase tracking-widest block mb-2">${t('confirm.type_label')}</label>
                   <div class="grid grid-cols-2 gap-3">
                       <label class="cursor-pointer label-checked-bg">
                           <input type="radio" name="hydrant-type" value="underground" class="peer sr-only" ${initialType === 'underground' ? 'checked' : ''}>
                           <div class="p-4 rounded-xl bg-white/10 border border-white/10 hover:bg-white/20 peer-checked:bg-red-600 peer-checked:border-red-500 peer-checked:text-white transition text-center">
                               <span class="text-2xl block mb-1">🕳️</span>
                               <span class="text-sm font-bold">${t('confirm.types.underground')}</span>
                           </div>
                       </label>

                       <label class="cursor-pointer label-checked-bg">
                           <input type="radio" name="hydrant-type" value="pillar" class="peer sr-only" ${initialType === 'pillar' ? 'checked' : ''}>
                           <div class="p-4 rounded-xl bg-white/10 border border-white/10 hover:bg-white/20 peer-checked:bg-red-600 peer-checked:border-red-500 peer-checked:text-white transition text-center">
                               <span class="text-2xl block mb-1">📮</span>
                               <span class="text-sm font-bold">${t('confirm.types.pillar')}</span>
                           </div>
                       </label>
                       
                       <label class="cursor-pointer label-checked-bg">
                           <input type="radio" name="hydrant-type" value="wall" class="peer sr-only" ${initialType === 'wall' ? 'checked' : ''}>
                           <div class="p-4 rounded-xl bg-white/10 border border-white/10 hover:bg-white/20 peer-checked:bg-red-600 peer-checked:border-red-500 peer-checked:text-white transition text-center">
                               <span class="text-2xl block mb-1">🧱</span>
                               <span class="text-sm font-bold">${t('confirm.types.wall')}</span>
                           </div>
                       </label>

                       <label class="cursor-pointer label-checked-bg">
                           <input type="radio" name="hydrant-type" value="suction_point" class="peer sr-only" ${initialType === 'suction_point' ? 'checked' : ''}>
                           <div class="p-4 rounded-xl bg-white/10 border border-white/10 hover:bg-white/20 peer-checked:bg-red-600 peer-checked:border-red-500 peer-checked:text-white transition text-center">
                               <span class="text-2xl block mb-1">💧</span>
                               <span class="text-sm font-bold">${t('confirm.types.suction')}</span>
                           </div>
                       </label>
                   </div>
                </div>

                <!-- Position Selection (Where is it?) -->
                <div>
                   <label class="text-gray-400 text-xs font-bold uppercase tracking-widest block mb-2">${t('confirm.position_label')}</label>
                   <div class="relative">
                       <select id="hydrant-position" class="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-3 appearance-none focus:outline-none focus:border-red-500">
                          <option value="sidewalk" ${initialLocation === 'sidewalk' ? 'selected' : ''}>${t('confirm.locations.sidewalk')}</option>
                          <option value="street" ${initialLocation === 'street' ? 'selected' : ''}>${t('confirm.locations.street')}</option>
                          <option value="green" ${initialLocation === 'green' ? 'selected' : ''}>${t('confirm.locations.green')}</option>
                          <option value="parking" ${initialLocation === 'parking' ? 'selected' : ''}>${t('confirm.locations.parking')}</option>
                       </select>
                       <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                   </div>
                </div>

                <!-- Diameter (Input) -->
                <div>
                   <label class="text-gray-400 text-xs font-bold uppercase tracking-widest block mb-2">${t('confirm.details_label')}</label>
                   <div class="flex gap-4">
                       <input type="number" id="hydrant-diameter" placeholder="100" class="w-1/2 bg-white/10 border border-white/20 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-500 text-center font-mono placeholder-gray-600">
                       <input type="text" id="hydrant-ref" placeholder="Ref/Nr" class="w-1/2 bg-white/10 border border-white/20 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-500 text-center font-mono placeholder-gray-600">
                   </div>
                </div>

            </div>
        </div>

        <!-- Sticky Footer Action -->
        <div class="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black via-black to-transparent z-20">
            <button id="upload-btn" class="w-full py-4 bg-green-600 hover:bg-green-500 text-white rounded-2xl font-bold text-lg shadow-lg shadow-green-900/30 flex items-center justify-center gap-2 active:scale-95 transition-all">
                <span>☁️</span> ${t('confirm.upload_btn')}
            </button>
        </div>
      </div>
    `;
}

export function initConfirmView(element, imageBlob, location, onRetake, onSubmit) {
  const submitBtn = element.querySelector('#upload-btn');
  const backBtn = element.querySelector('#confirm-back-btn');
  const typeInput = element.querySelectorAll('input[name="hydrant-type"]');
  const posInput = element.querySelector('#hydrant-position');
  const diameterInput = element.querySelector('#hydrant-diameter');
  const refInput = element.querySelector('#hydrant-ref');

  // Map Setup (Hero)
  const mapContainer = element.querySelector('#confirm-map');
  const center = [location.lat || 48.137, location.lng || 11.576]; // Safe Access
  const map = L.map(mapContainer, { zoomControl: false }).setView(center, 19);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: ''
  }).addTo(map);

  const marker = L.marker(center, { draggable: true }).addTo(map);

  marker.on('dragend', function (event) {
    const position = marker.getLatLng();
    location.lat = position.lat;
    location.lng = position.lng;
  });

  if (backBtn && onRetake) {
    backBtn.onclick = onRetake.back;
  }

  submitBtn.onclick = () => {
    let selectedType = 'underground';
    typeInput.forEach(r => { if (r.checked) selectedType = r.value; });

    const selectedPos = posInput.value;

    const tags = {};
    if (selectedType === 'suction_point') { // Suction Point Logic
      tags['emergency'] = 'suction_point';
    } else {
      tags['emergency'] = 'fire_hydrant';
      tags['fire_hydrant:type'] = selectedType;
    }

    if (selectedPos) tags['fire_hydrant:position'] = selectedPos;
    if (diameterInput.value) tags['fire_hydrant:diameter'] = diameterInput.value;
    if (refInput.value) tags['ref'] = refInput.value;

    onSubmit({
      ...location,
      tags: tags
    });
  };

  setTimeout(() => map.invalidateSize(), 300);
}
