import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { t } from '../services/i18n.js';

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
        <div class="absolute bottom-4 right-4 w-20 h-28 rounded-xl border-2 border-white/30 shadow-2xl overflow-hidden bg-black z-50 transition transform origin-bottom-right hover:scale-[2.5] active:scale-[2.5] cursor-pointer group">
            <img id="preview-img" class="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition" alt="${t('confirm.preview_alt') || 'Hydrant Preview'}" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"></div>
            <span class="absolute bottom-1 right-2 text-[10px] font-bold text-white/80">FOTO</span>
        </div>

        <!-- Back Button (Floating) - Ensuring correct z-index -->
        <div class="absolute top-4 left-4 z-50">
           <button id="retake-btn" class="bg-black/40 backdrop-blur-md p-3 rounded-full text-white hover:bg-black/60 transition shadow-lg border border-white/10" aria-label="${t('confirm.back_btn_aria') || 'Back to Camera'}">
              <svg aria-hidden="true" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
           </button>
        </div>

        <!-- Accuracy Pill & Retry -->
        <div class="absolute top-4 right-4 z-50 flex flex-col items-end gap-2">
           <div class="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-white/90 border border-white/10 shadow-lg" id="geo-status-pill">
              GPS: ...
           </div>
           <button id="gps-retry-btn" class="bg-blue-600/80 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-bold text-white shadow-lg active:scale-95 transition hidden" aria-label="${t('confirm.retry_gps_aria') || 'Retry GPS'}">
              🔄 GPS neu laden
           </button>
        </div>
      </div>

      <!-- Scrollable Form Content -->
      <div class="flex-grow overflow-y-auto px-4 pt-6 pb-48 space-y-8 bg-slate-900">
         
         <div class="relative mb-4 flex items-center justify-center gap-3">
            <h2 id="confirm-title" class="text-2xl font-bold text-white">${t('confirm.title') || 'Neuer Hydrant'}</h2>
            
            <!-- Delete Button Container (injected via JS if edit mode) -->
            <div id="delete-btn-container" class="hidden">
               <button id="delete-hydrant-btn" class="bg-red-600 text-white hover:bg-red-700 p-3 rounded-full transition shadow-lg shadow-red-900/40 flex items-center justify-center" aria-label="Löschen">
                  <span class="text-xl">🗑️</span>
               </button>
            </div>
         </div>

         <!-- Type Selection (Grid) -->
          <div class="space-y-3">
             <h3 class="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">${t('confirm.type_label')}</h3>
             
             <!-- Row 1: Main Types -->
             <div id="type-grid-main" class="grid grid-cols-2 gap-2">
                 <!-- JS Populated Main -->
             </div>
             
             <!-- Row 2: Secondary Types -->
             <div id="type-grid-secondary" class="grid grid-cols-4 gap-2">
                 <!-- JS Populated Secondary -->
             </div>
             
             <!-- SIGN Container (Moved here for proximity) -->
             <div id="sign-container" class="hidden mt-2 border-t border-gray-800 pt-2 animate-fade-in">
                 <label class="block text-[10px] uppercase text-gray-500 mb-1 font-bold">Hinweisschild für Unterflurhydrant</label>
                 <div class="grid grid-cols-3 gap-2 bg-gray-800/50 p-1 rounded-xl">
                     <button type="button" class="sign-option-btn py-2 px-1 rounded-lg text-gray-400 font-bold transition text-xs flex items-center justify-center gap-1" data-value="yes">
                        ✅ Ja
                     </button>
                     <button type="button" class="sign-option-btn py-2 px-1 rounded-lg text-gray-400 font-bold transition text-xs flex items-center justify-center gap-1" data-value="no">
                        ❌ Nein
                     </button>
                     <button type="button" class="sign-option-btn py-2 px-1 rounded-lg text-gray-400 font-bold transition text-xs flex items-center justify-center gap-1" data-value="unknown">
                        ❓ Unbekannt
                     </button>
                 </div>
                 <input type="hidden" id="hydrant-sign" value="unknown">
             </div>

             <input type="hidden" id="hydrant-type" value="pillar">
          </div>

         <!-- Position Selection -->
         <div class="space-y-3">
             <h3 class="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">${t('confirm.position_label')}</h3>
             <div class="grid grid-cols-5 gap-2 bg-gray-800/50 p-1 rounded-xl">
                 <button type="button" class="pos-option-btn py-2 px-1 rounded-lg text-gray-400 font-bold transition text-xs flex items-center justify-center gap-1" data-value="">
                    🚫 ${t('confirm.locations.none') || 'Keine'}
                 </button>
                <button type="button" class="pos-option-btn py-2 px-1 rounded-lg text-gray-400 font-bold transition text-xs flex items-center justify-center gap-1" data-value="sidewalk">
                   🚶 ${t('confirm.locations.sidewalk')}
                </button>
                <button type="button" class="pos-option-btn py-2 px-1 rounded-lg text-gray-400 font-bold transition text-xs flex items-center justify-center gap-1" data-value="lane">
                   🚗 ${t('confirm.locations.street')}
                </button>
                <button type="button" class="pos-option-btn py-2 px-1 rounded-lg text-gray-400 font-bold transition text-xs flex items-center justify-center gap-1" data-value="parking_lane">
                   🅿️ ${t('confirm.locations.parking')}
                </button>
                <button type="button" class="pos-option-btn py-2 px-1 rounded-lg text-gray-400 font-bold transition text-xs flex items-center justify-center gap-1" data-value="green">
                   🌳 ${t('confirm.locations.green')}
                </button>
             </div>
             <input type="hidden" id="hydrant-position" value="sidewalk">
         </div>

         <!-- Details (Visible) -->
         <div class="space-y-4 pt-4 border-t border-gray-800">
            
            <!-- Diameter / Volume -->
             <div id="diameter-container">
                 <label for="hydrant-diameter" class="block text-[10px] uppercase text-gray-500 mb-1 font-bold">${t('confirm.diameter_label')}</label>
                 <!-- Using type="tel" to trigger numeric keypad on mobile but avoid spinner arrows -->
                 <input type="tel" inputmode="numeric" pattern="[0-9]*" id="hydrant-diameter" placeholder="z.B. 80, 100" class="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white outline-none appearance-none">
             </div>

            <div id="volume-container" class="hidden">
                <label for="hydrant-volume" class="block text-[10px] uppercase text-gray-500 mb-1 font-bold">Volumen (m³)</label>
                <input type="text" id="hydrant-volume" placeholder="z.B. 100" class="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white outline-none">
            </div>

            <div class="space-y-4">
                <!-- SIGN Container removed from here -->
               

               
               <div id="ref-container">
                  <label for="hydrant-ref" class="block text-[10px] uppercase text-gray-500 mb-1 font-bold">${t('confirm.number_label')}</label>
                  <input type="text" id="hydrant-ref" placeholder="${t('confirm.number_placeholder')}" maxlength="50" class="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white outline-none">
               </div>
               
               <div>
                  <label for="hydrant-note" class="block text-[10px] uppercase text-gray-500 mb-1 font-bold">${t('confirm.notes_label')}</label>
                  <textarea id="hydrant-note" placeholder="${t('confirm.notes_placeholder')}" maxlength="255" class="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white h-20 outline-none"></textarea>
               </div>
            </div>
         </div>
      </div>

      <!-- Submit Footer (Raised) -->
      <div class="fixed bottom-0 left-0 right-0 p-4 pb-20 bg-slate-900/90 backdrop-blur-xl border-t border-gray-800/50 z-50 max-w-sm mx-auto">
         <button id="submit-img-btn" class="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-green-900/30 active:scale-95 transition-all flex items-center justify-center gap-2">
            <span>${t('confirm.upload_btn')}</span>
         </button>
      </div>
    </div>
  `;
}

// Update signature to include onDelete
export function initConfirmView(element, imageBlob, location, onRetake, onSubmit, editMode = false, initialData = null, onDelete = null) {
  try {
    // Guard Location
    if (!location && !editMode) {
      console.warn("ConfirmView: Location missing, using fallback.");
      location = { lat: 48.137, lng: 11.576, accuracy: 1000 };
    } else if (editMode && initialData) {
      location = { lat: initialData.lat, lng: initialData.lng, accuracy: 0 };
    }

    // Edit Mode Enhancements
    if (editMode) {
      const titleEl = element.querySelector('#confirm-title');
      // Show Delete Button
      const delContainer = element.querySelector('#delete-btn-container');
      if (delContainer) delContainer.classList.remove('hidden');

      const delBtn = element.querySelector('#delete-hydrant-btn');
      if (delBtn && onDelete) {
        // Translate aria-label if possible, or leave/update
        delBtn.setAttribute('aria-label', t('confirm.delete_btn'));
        delBtn.onclick = () => {
          if (confirm(t('confirm.delete_confirm'))) {
            onDelete(initialData.id, initialData.version);
          }
        };
      }

      // Modify Retake/Back Button for Cancel
      const retakeBtn = element.querySelector('#retake-btn');
      if (retakeBtn) {
        console.log("ConfirmView: Converting Retake Button to Cancel Button.");
        retakeBtn.classList.remove('hidden');
        retakeBtn.style.display = 'flex'; // Force display
        retakeBtn.style.zIndex = '50'; // Force on top
        retakeBtn.setAttribute('aria-label', t('confirm.cancel_btn') || "Abbrechen");
        // Change Icon to X
        retakeBtn.innerHTML = `<svg aria-hidden="true" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`;
      } else {
        console.error("ConfirmView: Retake Button NOT FOUND in DOM.");
      }

      const previewImg = element.querySelector('#preview-img');
      if (previewImg) previewImg.parentElement.classList.add('hidden'); // Hide container

      // Change Submit Button Text
      const submitBtn = element.querySelector('#submit-img-btn');
      if (submitBtn) submitBtn.innerHTML = `<span>💾 ${t('confirm.save_btn')}</span>`;

      // Hide GPS Retry
      const retryBtn = element.querySelector('#gps-retry-btn');
      if (retryBtn) retryBtn.remove();

      // Update Pill
      const gpsPill = element.querySelector('#geo-status-pill');
      if (gpsPill) {
        if (initialData._isPartOfWay) {
          gpsPill.innerText = "🔒 Position fixiert";
          gpsPill.classList.add('text-red-400', 'border-red-500/50');
        } else {
          gpsPill.innerText = t('confirm.position_adjustable');
        }
      }
    }

    const img = element.querySelector('#preview-img');
    if (imageBlob && img && !editMode) {
      img.src = URL.createObjectURL(imageBlob);
    }

    const retakeBtn = element.querySelector('#retake-btn');
    const submitBtn = element.querySelector('#submit-img-btn');
    const typeInput = element.querySelector('#hydrant-type');
    const posInput = element.querySelector('#hydrant-position');

    const volumeContainer = element.querySelector('#volume-container');
    const volumeInput = element.querySelector('#hydrant-volume');
    const diameterContainer = element.querySelector('#diameter-container');
    const diameterInput = element.querySelector('#hydrant-diameter');
    const retryBtn = element.querySelector('#gps-retry-btn');
    const refInput = element.querySelector('#hydrant-ref');
    const noteInput = element.querySelector('#hydrant-note');
    const signInput = element.querySelector('#hydrant-sign');

    // DIRTY CHECKING LOGIC
    let hasChanges = false;
    const checkChanges = () => {
      if (!editMode || !initialData) return;

      const currentType = typeInput ? typeInput.value : 'pillar';
      const currentPos = posInput ? posInput.value : '';
      const currentDiameter = diameterInput ? diameterInput.value : '';
      const currentRef = refInput ? refInput.value : '';
      const currentNote = noteInput ? noteInput.value : '';
      const currentSign = signInput ? signInput.value : 'unknown';
      const currentVolume = volumeInput ? volumeInput.value.replace(' m3', '') : '';

      // Helper to safely get tag
      const getTag = (k) => initialData.tags[k] || '';

      // Compare Tags
      let typeChanged = false;
      if (currentType === 'cistern') {
        typeChanged = (getTag('emergency') !== 'water_tank');
      } else if (currentType === 'dry_hydrant') {
        typeChanged = (getTag('fire_hydrant:type') !== 'dry_hydrant');
      } else {
        typeChanged = (getTag('fire_hydrant:type') !== currentType);
      }

      const posChanged = (getTag('fire_hydrant:position') !== currentPos);
      const diaChanged = (getTag('fire_hydrant:diameter') !== currentDiameter);
      const refChanged = (getTag('ref') !== currentRef);
      const noteChanged = ((getTag('note') || getTag('description')) !== currentNote);

      // Sign check logic
      let signChanged = false;
      const originalSign = getTag('fire_hydrant:diameter:signed');

      if (currentSign === 'no') {
        signChanged = (originalSign !== 'no');
      } else if (currentSign === 'yes') {
        signChanged = (originalSign !== 'yes');
      } else {
        // Unknown: Changed if it currently HAS a value (either yes or no)
        signChanged = (originalSign === 'yes' || originalSign === 'no');
      }

      // Compare Location (Float precision tolerance)
      const latDiff = Math.abs(location.lat - initialData.lat);
      const lngDiff = Math.abs(location.lng - initialData.lng);
      const locChanged = (latDiff > 0.000001 || lngDiff > 0.000001);

      hasChanges = (typeChanged || posChanged || diaChanged || refChanged || noteChanged || signChanged || locChanged);

      // Update UI
      if (submitBtn) {
        if (hasChanges) {
          submitBtn.innerHTML = `<span>💾 ${t('confirm.save_btn')}</span>`;
          submitBtn.classList.remove('bg-gray-700', 'hover:bg-gray-600');
          submitBtn.classList.add('bg-green-600', 'hover:bg-green-700');
        } else {
          submitBtn.innerHTML = `<span>${t('confirm.back_btn_label') || "Zurück"}</span>`;
          submitBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
          submitBtn.classList.add('bg-gray-700', 'hover:bg-gray-600');
        }
      }
    };



    // Attach Listeners for Dirty Check
    if (editMode) {
      // Inputs
      [typeInput, posInput, diameterInput, refInput, noteInput, volumeInput].forEach(el => {
        if (el) el.addEventListener('input', checkChanges);
        if (el) el.addEventListener('change', checkChanges);
      });
      // Initial Check (Delayed slightly to handle preload)
      setTimeout(checkChanges, 300);
    }

    // GRID OPTIONS UPDATED
    const mainTypes = [
      // SVG Icon for Pillar Hydrant (Red Pillar shape)
      {
        id: 'pillar',
        label: t('confirm.types.pillar'),
        icon: `<svg viewBox="0 0 24 24" class="w-10 h-10 drop-shadow-md" fill="none" xmlns="http://www.w3.org/2000/svg">
                 <path d="M7 21H17V19H15V11H17C17.55 11 18 10.55 18 10V8C18 7.45 17.55 7 17 7H15V5C15 3.34 13.66 2 12 2C10.34 2 9 3.34 9 5V7H7C6.45 7 6 7.45 6 8V10C6 10.55 6.45 11 7 11H9V19H7V21ZM11 5C11 4.45 11.45 4 12 4C12.55 4 13 4.45 13 5V7H11V5ZM7 8H9V10H7V8ZM15 8H17V10H15V8Z" fill="#DC2626"/>
               </svg>`
      },
      { id: 'underground', label: t('confirm.types.underground'), icon: '<span class="text-4xl mb-1">🕳️</span>' }
    ];
    const subTypes = [
      { id: 'dry_hydrant', label: t('confirm.types.dry_hydrant'), icon: '<span class="text-xl">🌵</span>' },
      // Wall Hydrant SVG: A building with a small box on side
      // Or simpler: A wall section with a small square
      {
        id: 'wall',
        label: t('confirm.types.wall'),
        icon: `<svg viewBox="0 0 24 24" class="w-8 h-8 drop-shadow-md" fill="none" class="text-gray-400" xmlns="http://www.w3.org/2000/svg">
                 <path d="M4 22H20V2H4V22ZM13 14H16V17H13V14Z" fill="currentColor"/>
                 <path d="M12 12V19H17V12H12Z" stroke="#EF4444" stroke-width="2"/>
               </svg>`
      },
      { id: 'cistern', label: t('confirm.types.cistern'), icon: '<span class="text-xl">🛢️</span>' },
      // Suction Point SVG: River/Stream with plants
      {
        id: 'suction_point',
        label: t('confirm.types.suction'),
        icon: `<svg viewBox="0 0 24 24" class="w-8 h-8 drop-shadow-md" fill="none" xmlns="http://www.w3.org/2000/svg">
                 <path d="M22 17C22 17 19 14 15 14C11 14 9 17 5 17C2.5 17 2 15.5 2 15.5V19C2 19 4 21 8 21C12 21 14 18 18 18C21 18 22 19 22 19V17Z" fill="#3B82F6"/>
                 <path d="M22 13C22 13 19 10 15 10C11 10 9 13 5 13C2.5 13 2 11.5 2 11.5V9.5C2 9.5 4 11 8 11C12 11 14 8 18 8C21 8 22 9 22 9V13Z" fill="#60A5FA"/>
                 <circle cx="17" cy="5" r="2" fill="#FCD34D"/>
               </svg>`
      }
    ];

    const gridMain = element.querySelector('#type-grid-main');
    const gridSub = element.querySelector('#type-grid-secondary');
    const signContainer = element.querySelector('#sign-container');
    const refContainer = element.querySelector('#ref-container');

    if (gridMain && gridSub) {
      // Render Main
      gridMain.innerHTML = mainTypes.map(opt => `
             <button type="button" class="option-btn h-24 rounded-xl border-2 border-transparent bg-gray-800 text-gray-400 hover:bg-gray-700 hover:scale-[1.02] active:scale-95 transition flex flex-col items-center justify-center gap-1" data-value="${opt.id}" aria-label="${opt.label}">
                <span aria-hidden="true">${opt.icon}</span>
                <span class="text-sm font-bold uppercase tracking-tight" aria-hidden="true">${opt.label}</span>
             </button>
       `).join('');

      // Render Sub
      gridSub.innerHTML = subTypes.map(opt => `
             <button type="button" class="option-btn h-16 rounded-xl border-2 border-transparent bg-gray-800 text-gray-400 hover:bg-gray-700 hover:scale-105 active:scale-95 transition flex flex-col items-center justify-center gap-1" data-value="${opt.id}" aria-label="${opt.label}">
                <span aria-hidden="true">${opt.icon}</span>
                <span class="text-[9px] font-bold uppercase tracking-tight" aria-hidden="true">${opt.label}</span>
             </button>
       `).join('');

      // Grid Logic
      const optionBtns = element.querySelectorAll('.option-btn');
      const updateGrid = (val) => {
        if (typeInput) typeInput.value = val;

        optionBtns.forEach(btn => {
          if (btn.dataset.value === val) {
            btn.classList.add('border-green-500', 'bg-green-900/30', 'text-white', 'shadow-md');
            btn.classList.remove('border-transparent', 'bg-gray-800', 'text-gray-400');
          } else {
            btn.classList.remove('border-green-500', 'bg-green-900/30', 'text-white', 'shadow-md');
            btn.classList.add('border-transparent', 'bg-gray-800', 'text-gray-400');
          }
        });

        // Visibility Toggles
        // Suction Point: No Diameter, No Number.
        // Cistern: No Diameter, Yes Volume, (Number? keep default)

        if (val === 'cistern') {
          if (volumeContainer) volumeContainer.classList.remove('hidden');
          if (diameterContainer) diameterContainer.classList.add('hidden');
          if (refContainer) refContainer.classList.remove('hidden');
        } else if (val === 'suction_point') {
          if (volumeContainer) volumeContainer.classList.add('hidden');
          if (diameterContainer) diameterContainer.classList.add('hidden');
          if (refContainer) refContainer.classList.add('hidden');
        } else {
          // Normal cases
          if (volumeContainer) volumeContainer.classList.add('hidden');
          if (diameterContainer) diameterContainer.classList.remove('hidden');
          if (refContainer) refContainer.classList.remove('hidden');
        }

        // Sign Container Logic
        if (signContainer) {
          if (val === 'underground') {
            signContainer.classList.remove('hidden');
          } else {
            signContainer.classList.add('hidden');
          }
        }

        if (typeof checkChanges === 'function') checkChanges();
      };

      element.querySelectorAll('.option-btn').forEach(btn => {
        btn.onclick = () => updateGrid(btn.dataset.value);
      });

      // PRE-FILL DATA IF EDITING
      if (editMode && initialData && initialData.tags) {
        const nodeTags = initialData.tags;
        // Type
        let typeVal = 'pillar';
        if (nodeTags['emergency'] === 'water_tank') typeVal = 'cistern';
        else if (nodeTags['emergency'] === 'suction_point') typeVal = 'suction_point';
        else if (nodeTags['fire_hydrant:type'] === 'dry_hydrant') typeVal = 'dry_hydrant';
        else if (nodeTags['fire_hydrant:type']) typeVal = nodeTags['fire_hydrant:type'];

        updateGrid(typeVal);

        // Position
        if (nodeTags['fire_hydrant:position'] && posInput) {
          // We need to trigger the position button update logic too
          // let's do it below in position logic
        }

        // Diameter
        if (diameterInput && nodeTags['fire_hydrant:diameter']) diameterInput.value = nodeTags['fire_hydrant:diameter'];

        // Ref
        if (refInput && nodeTags['ref']) refInput.value = nodeTags['ref'];

        // Note
        if (noteInput && (nodeTags['note'] || nodeTags['description'])) noteInput.value = nodeTags['note'] || nodeTags['description'];

        // Sign (Pre-calc)
        if (signInput) {
          if (nodeTags['fire_hydrant:diameter:signed'] === 'no' || nodeTags['ref:signed'] === 'no') {
            // If it's explicitly NO
            // We need to update sign UI
            // We'll do it via updateSign logic below if we extract it, 
            // or just set input and let init do it? 
            // Let's set the input value for now, logic below handles UI state
            signInput.value = 'no';
          } else if (nodeTags['fire_hydrant:diameter:signed'] === 'yes') {
            signInput.value = 'yes';
          }
          // else unknown
        }
      } else {
        updateGrid('pillar'); // Default
      }
    }

    // Position Logic
    const posBtns = element.querySelectorAll('.pos-option-btn');
    const updatePos = (val) => {
      if (posInput) posInput.value = val;
      posBtns.forEach(btn => {
        if (btn.dataset.value === val) {
          btn.classList.add('bg-blue-600', 'text-white', 'shadow-lg');
          btn.classList.remove('text-gray-400');
        } else {
          btn.classList.remove('bg-blue-600', 'text-white', 'shadow-lg');
          btn.classList.add('text-gray-400');
        }
      });
      if (typeof checkChanges === 'function') checkChanges();
    };
    posBtns.forEach(btn => {
      btn.onclick = () => updatePos(btn.dataset.value);
    });

    // Pre-fill Position
    if (editMode && initialData && initialData.tags && initialData.tags['fire_hydrant:position']) {
      let pos = initialData.tags['fire_hydrant:position'];
      if (pos === 'street') pos = 'lane'; // Allocate legacy 'street' to 'lane'
      updatePos(pos);
    } else {
      updatePos('');
    }

    // Sign Logic
    const signBtns = element.querySelectorAll('.sign-option-btn');
    const updateSign = (val) => {
      if (signInput) signInput.value = val;
      signBtns.forEach(btn => {
        if (btn.dataset.value === val) {
          btn.classList.add('bg-blue-600', 'text-white', 'shadow-lg');
          btn.classList.remove('text-gray-400', 'bg-gray-800');
        } else {
          btn.classList.remove('bg-blue-600', 'text-white', 'shadow-lg');
          btn.classList.add('text-gray-400');
        }
      });
      if (typeof checkChanges === 'function') checkChanges();
    };
    signBtns.forEach(btn => {
      btn.onclick = () => updateSign(btn.dataset.value);
    });

    // Initial Sign State
    if (signInput && signInput.value) {
      updateSign(signInput.value);
    } else {
      updateSign('unknown');
    }



    // Attach Listeners for Dirty Check
    if (editMode) {
      // Inputs
      [typeInput, posInput, diameterInput, refInput, noteInput, volumeInput, signInput].forEach(el => {
        if (el) el.addEventListener('input', checkChanges);
        if (el) el.addEventListener('change', checkChanges);
      });
      // Color input is hidden, handled in click handler below

      // Initial Check
      setTimeout(checkChanges, 500);
    }

    // Map Setup (Hero)
    const mapContainer = element.querySelector('#map');
    if (mapContainer) {
      const center = [location.lat || 48.137, location.lng || 11.576]; // Safe Access
      const map = L.map(mapContainer, {
        zoomControl: false,
        dragging: !editMode, // Disable map panning in edit mode
        touchZoom: !editMode,
        doubleClickZoom: !editMode,
        scrollWheelZoom: !editMode,
        boxZoom: !editMode,
        keyboard: !editMode
      }).setView(center, 19);

      const isLocked = editMode && initialData && initialData._isPartOfWay;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: ''
      }).addTo(map);

      // Disable dragging if locked
      const marker = L.marker(center, { draggable: !isLocked, autoPan: !isLocked }).addTo(map); // Always draggable now
      const statusPill = document.querySelector('#geo-status-pill');

      marker.on('dragend', function (event) {
        const position = marker.getLatLng();
        location.lat = position.lat;
        location.lng = position.lng;
        // Re-render pill text correctly
        if (statusPill) statusPill.innerText = editMode ? t('confirm.position_moved') : `📍 Verschoben`;

        if (editMode) checkChanges();
      });

      const accuracy = location.accuracy ? Math.round(location.accuracy) : '?';
      if (statusPill && !statusPill.innerText.includes('Verschoben')) {
        statusPill.innerText = editMode ? t('confirm.fixed_map') : `GPS: ±${accuracy}m`;
      }

      // Retry Button Logic
      if (retryBtn && !editMode) {
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

      setTimeout(() => map.invalidateSize(), 300);
    }

    if (retakeBtn) {
      console.log("ConfirmView: Retake Button found, attaching listener.");
      retakeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent map clicks
        console.log("ConfirmView: Back button clicked");
        if (onRetake && typeof onRetake.back === 'function') {
          onRetake.back();
        } else {
          console.error("ConfirmView: onRetake.back is not a function", onRetake);
          alert("Fehler: Zurück-Funktion nicht verfügbar.");
        }
      });
    }

    if (submitBtn) {
      submitBtn.onclick = () => {
        // If EditMode and No Changes, just go back (Cancel)
        if (editMode && !hasChanges) {
          console.log("No changes detected, cancelling edit.");
          if (onRetake && onRetake.back) onRetake.back();
          return;
        }

        const selectedType = typeInput ? typeInput.value : 'pillar';
        const selectedPos = posInput ? posInput.value : '';

        // Start with initial tags if editing (Merge Strategy)
        const tags = (editMode && initialData) ? { ...initialData.tags } : {};

        // Overwrite/Set specific app fields
        if (selectedType === 'cistern') {
          tags['emergency'] = 'water_tank';
          // Clear fire_hydrant keys if switching to cistern? Maybe safer to leave them if they existed?
          // Let's overwrite type to be sure.
          tags['fire_hydrant:type'] = null; // or remove? undefined
          delete tags['fire_hydrant:type'];

          if (volumeInput && volumeInput.value) {
            let val = volumeInput.value.trim();
            if (/^\d+$/.test(val)) val += " m3";
            tags['water_tank:volume'] = val;
          }
          tags['fire_hydrant:position'] = selectedPos;

        } else if (selectedType === 'dry_hydrant') {
          tags['emergency'] = 'fire_hydrant';
          tags['fire_hydrant:type'] = 'dry_hydrant';
          tags['fire_hydrant:position'] = selectedPos;
          delete tags['water_tank:volume']; // Cleanup collision
        }
        else if (selectedType === 'suction_point') {
          tags['emergency'] = 'suction_point';
          tags['fire_hydrant:position'] = selectedPos;
          delete tags['fire_hydrant:type'];
          delete tags['water_tank:volume'];
          delete tags['ref'];
          delete tags['fire_hydrant:diameter'];
        }
        else {
          tags['emergency'] = 'fire_hydrant';
          tags['fire_hydrant:type'] = selectedType;
          tags['fire_hydrant:position'] = selectedPos;
          delete tags['water_tank:volume'];

          // Sign Logic
          if (selectedType === 'underground' && signInput) {
            const signVal = signInput.value;
            // If NO -> explicit tags
            if (signVal === 'no') {
              tags['fire_hydrant:diameter:signed'] = 'no';
              tags['ref:signed'] = 'no';
            }
            else if (signVal === 'yes') {
              // Explicit Yes
              tags['fire_hydrant:diameter:signed'] = 'yes';
              if (tags['ref:signed'] === 'no') delete tags['ref:signed']; // Remove conflict
            } else {
              // Unknown -> Remove tags if they exist (Reset to default)
              delete tags['fire_hydrant:diameter:signed'];
              delete tags['ref:signed'];
            }
          }
        }

        if (diameterInput && diameterInput.value) tags['fire_hydrant:diameter'] = diameterInput.value;
        const ref = element.querySelector('#hydrant-ref');
        if (ref && ref.value) tags['ref'] = ref.value;

        const note = element.querySelector('#hydrant-note');
        if (note && note.value) tags['note'] = note.value; // Prefer note over description?

        onSubmit({
          ...location,
          tags: tags,
          id: editMode ? initialData.id : null,
          version: editMode ? initialData.version : null
        });
      };
    }
  } catch (err) {
    console.error("FATAL ConfirmView Error", err);
    alert("UI Error: " + err.message);
  }
}
