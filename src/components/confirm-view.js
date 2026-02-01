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
        <div class="absolute bottom-4 right-4 w-20 h-28 rounded-xl border-2 border-white/30 shadow-2xl overflow-hidden bg-black z-10 transition transform origin-bottom-right hover:scale-[2.5] active:scale-[2.5] cursor-pointer group">
            <img id="preview-img" class="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition" alt="${t('confirm.preview_alt') || 'Hydrant Preview'}" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"></div>
            <span class="absolute bottom-1 right-2 text-[10px] font-bold text-white/80">FOTO</span>
        </div>

        <!-- Back Button (Floating) -->
        <div class="absolute top-4 left-4 z-20">
           <button id="retake-btn" class="bg-black/40 backdrop-blur-md p-3 rounded-full text-white hover:bg-black/60 transition shadow-lg border border-white/10" aria-label="${t('confirm.back_btn_aria') || 'Back to Camera'}">
              <svg aria-hidden="true" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
           </button>
        </div>

        <!-- Accuracy Pill & Retry -->
        <div class="absolute top-4 right-4 z-20 flex flex-col items-end gap-2">
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
               <button id="delete-hydrant-btn" class="bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white p-2 rounded-full transition border border-red-500/30" aria-label="Löschen">
                  <span class="text-xl">🗑️</span>
               </button>
            </div>
         </div>

         <!-- Type Selection (Grid) -->
         <div class="space-y-3">
            <h3 class="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">${t('confirm.type_label')}</h3>
            <div id="type-grid" class="grid grid-cols-5 gap-2">
               <!-- JS Populated Small Grid -->
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
                <button type="button" class="pos-option-btn py-2 px-1 rounded-lg text-gray-400 font-bold transition text-xs flex items-center justify-center gap-1" data-value="street">
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
                <select id="hydrant-diameter" class="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white outline-none">
                    <option value="">${t('confirm.diameter_none')}</option>
                    <option value="80">DN 80</option>
                    <option value="100">DN 100</option>
                    <option value="150">DN 150</option>
                    <option value="50">DN 50</option>
                </select>
            </div>

            <div id="volume-container" class="hidden">
                <label for="hydrant-volume" class="block text-[10px] uppercase text-gray-500 mb-1 font-bold">Volumen (m³)</label>
                <input type="text" id="hydrant-volume" placeholder="z.B. 100" class="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white outline-none">
            </div>

            <div class="space-y-4">
               <div>
                  <label class="block text-[10px] uppercase text-gray-500 mb-1 font-bold">${t('confirm.color_label')}</label>
                  <div class="flex flex-wrap gap-3" id="color-picker-container">
                      <!-- JS Populated -->
                  </div>
                  <input type="hidden" id="hydrant-colour" value="">
               </div>
               
               <div>
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
      if (titleEl) titleEl.innerText = "Hydrant bearbeiten" || t('confirm.title_edit');

      // Show Delete Button
      const delContainer = element.querySelector('#delete-btn-container');
      if (delContainer) delContainer.classList.remove('hidden');

      const delBtn = element.querySelector('#delete-hydrant-btn');
      if (delBtn && onDelete) {
        delBtn.onclick = () => {
          if (confirm("Hydrant wirklich löschen?")) {
            onDelete(initialData.id, initialData.version);
          }
        };
      }

      // Hide Retake/Photo
      const retakeBtn = element.querySelector('#retake-btn');
      if (retakeBtn) retakeBtn.classList.add('hidden');

      const previewImg = element.querySelector('#preview-img');
      if (previewImg) previewImg.parentElement.classList.add('hidden'); // Hide container

      // Change Submit Button Text
      const submitBtn = element.querySelector('#submit-img-btn');
      if (submitBtn) submitBtn.innerHTML = `<span>💾 Speichern</span>`;

      // Hide GPS Retry
      const retryBtn = element.querySelector('#gps-retry-btn');
      if (retryBtn) retryBtn.remove();

      // Update Pill
      const gpsPill = element.querySelector('#geo-status-pill');
      if (gpsPill) gpsPill.innerText = "Position anpassbar";
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
    const colorInput = element.querySelector('#hydrant-colour');

    // GRID OPTIONS (Emojis preferred by user)
    const options = [
      { id: 'pillar', label: t('confirm.types.pillar'), icon: '<span class="text-2xl">📮</span>' },
      { id: 'underground', label: t('confirm.types.underground'), icon: '<span class="text-2xl">🕳️</span>' },
      { id: 'wall', label: t('confirm.types.wall'), icon: '<span class="text-2xl">🧱</span>' },
      { id: 'cistern', label: t('confirm.types.suction'), icon: '<span class="text-2xl">💧</span>' },
      { id: 'dry_hydrant', label: 'Trocken', icon: '<span class="text-2xl">🌵</span>' }
    ];

    const grid = element.querySelector('#type-grid');
    if (grid) {
      grid.innerHTML = options.map(opt => `
             <button type="button" class="option-btn aspect-square rounded-xl border-2 border-transparent bg-gray-800 text-gray-400 hover:bg-gray-700 hover:scale-105 active:scale-95 transition flex flex-col items-center justify-center gap-1" data-value="${opt.id}" aria-label="${opt.label}">
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
            btn.classList.add('border-red-500', 'bg-red-900/30', 'text-white', 'shadow-md', 'shadow-red-900/20');
            btn.classList.remove('border-transparent', 'bg-gray-800', 'text-gray-400');
          } else {
            btn.classList.remove('border-red-500', 'bg-red-900/30', 'text-white', 'shadow-md', 'shadow-red-900/20');
            btn.classList.add('border-transparent', 'bg-gray-800', 'text-gray-400');
          }
        });

        if (val === 'cistern') {
          if (volumeContainer) volumeContainer.classList.remove('hidden');
          if (diameterContainer) diameterContainer.classList.add('hidden');
        } else {
          if (volumeContainer) volumeContainer.classList.add('hidden');
          if (diameterContainer) diameterContainer.classList.remove('hidden');
        }
      };

      element.querySelectorAll('.option-btn').forEach(btn => {
        btn.onclick = () => updateGrid(btn.dataset.value);
      });

      // PRE-FILL DATA IF EDITING
      if (editMode && initialData && initialData.tags) {
        const t = initialData.tags;
        // Type
        let typeVal = 'pillar';
        if (t['emergency'] === 'water_tank') typeVal = 'cistern';
        else if (t['fire_hydrant:type'] === 'dry_hydrant') typeVal = 'dry_hydrant';
        else if (t['fire_hydrant:type']) typeVal = t['fire_hydrant:type'];

        updateGrid(typeVal);

        // Position
        if (t['fire_hydrant:position'] && posInput) {
          // We need to trigger the position button update logic too
          // let's do it below in position logic
        }

        // Diameter
        if (diameterInput && t['fire_hydrant:diameter']) diameterInput.value = t['fire_hydrant:diameter'];

        // Ref
        if (refInput && t['ref']) refInput.value = t['ref'];

        // Note
        if (noteInput && (t['note'] || t['description'])) noteInput.value = t['note'] || t['description'];

        // Color (Complex because we have custom UI)
        if (colorInput && t['colour']) {
          colorInput.value = t['colour'];
          // Timer needed because color UI is built below? No, it's built before this block usually? 
          // Ah, color picker logic is further down. We should move pre-fill to end or ensure UI exists.
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
    };
    posBtns.forEach(btn => {
      btn.onclick = () => updatePos(btn.dataset.value);
    });

    // Pre-fill Position
    if (editMode && initialData && initialData.tags && initialData.tags['fire_hydrant:position']) {
      updatePos(initialData.tags['fire_hydrant:position']);
    } else {
      updatePos('');
    }

    // COLOR PICKER LOGIC
    const colors = [
      { value: "", label: t('confirm.locations.none'), hex: "transparent", border: "#4b5563" },
      { value: "black", label: t('confirm.colors.black'), hex: "#000000", border: "#333" },
      { value: "grey", label: t('confirm.colors.grey'), hex: "#808080", border: "#999" },
      { value: "blue", label: t('confirm.colors.blue'), hex: "#3b82f6", border: "#3b82f6" },
      { value: "red", label: t('confirm.colors.red'), hex: "#ef4444", border: "#ef4444" },
      { value: "yellow", label: t('confirm.colors.yellow'), hex: "#fbbf24", border: "#fbbf24" },
      { value: "green", label: t('confirm.colors.green'), hex: "#22c55e", border: "#22c55e" },
      { value: "white", label: t('confirm.colors.white'), hex: "#ffffff", border: "#ddd" }
    ];

    const colorContainer = element.querySelector('#color-picker-container');
    // const colorInput defined above

    if (colorContainer && colorInput) {
      colors.forEach(c => {
        const btn = document.createElement('button');
        btn.className = `w-10 h-10 rounded-full border-2 flex items-center justify-center transition hover:scale-110 focus:outline-none relative`;

        btn.style.backgroundColor = c.hex;
        btn.style.borderColor = c.border;

        if (c.value === "") {
          btn.innerHTML = '<span class="text-xs">🚫</span>';
        }
        btn.ariaLabel = c.label;

        // Click Handler
        btn.onclick = () => {
          // Reset
          Array.from(colorContainer.children).forEach(child => {
            child.classList.remove('ring-4', 'ring-white/50', 'scale-110');
            child.style.transform = 'scale(1)';
          });

          // Set Active
          btn.classList.add('ring-4', 'ring-white/50', 'scale-110');
          btn.style.transform = 'scale(1.1)';

          // Set Value
          colorInput.value = c.value;
        };

        // Pre-select if matches
        if (editMode && initialData && initialData.tags && initialData.tags['colour'] === c.value) {
          // Trigger visual select
          setTimeout(() => btn.click(), 0);
        }

        colorContainer.appendChild(btn);
      });
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

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: ''
      }).addTo(map);

      const marker = L.marker(center, { draggable: true, autoPan: true }).addTo(map); // Always draggable now
      const statusPill = document.querySelector('#geo-status-pill');

      marker.on('dragend', function (event) {
        const position = marker.getLatLng();
        location.lat = position.lat;
        location.lng = position.lng;
        // Re-render pill text correctly
        // const acc = location.accuracy ? Math.round(location.accuracy) : '?';
        if (statusPill) statusPill.innerText = editMode ? "Position angepasst" : `📍 Verschoben`;
      });

      const accuracy = location.accuracy ? Math.round(location.accuracy) : '?';
      if (statusPill && !statusPill.innerText.includes('Verschoben')) {
        statusPill.innerText = editMode ? "Verschiebbar (Karte fixiert)" : `GPS: ±${accuracy}m`;
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

    if (retakeBtn && !editMode) {
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
        else {
          tags['emergency'] = 'fire_hydrant';
          tags['fire_hydrant:type'] = selectedType;
          tags['fire_hydrant:position'] = selectedPos;
          delete tags['water_tank:volume'];
        }

        if (diameterInput && diameterInput.value) tags['fire_hydrant:diameter'] = diameterInput.value;
        const ref = element.querySelector('#hydrant-ref');
        if (ref && ref.value) tags['ref'] = ref.value;

        const col = element.querySelector('#hydrant-colour');
        if (col && col.value) tags['colour'] = col.value;
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
