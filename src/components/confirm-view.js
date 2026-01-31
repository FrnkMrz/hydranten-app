
export function renderConfirmView() {
  return `
    <div class="h-full w-full bg-slate-900 text-white flex flex-col p-4 animate-slide-up overflow-y-auto pb-safe">
      <!-- Header -->
      <div class="flex items-center justify-between mb-2 shrink-0">
          <button id="back-to-cam" class="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition">
             ❌
          </button>
          <h2 class="text-lg font-bold">Hydrant bestätigen</h2>
          <div class="w-10"></div> <!-- Spacer -->
      </div>
      
      <!-- Image Preview -->
      <div class="w-full h-48 bg-black rounded-xl overflow-hidden shadow-lg border border-gray-700 shrink-0 relative mb-4">
         <img id="preview-img" class="w-full h-full object-cover opacity-0 transition-opacity duration-500" />
      </div>
      
      <!-- Form Fields -->
      <div class="space-y-4">
         
         <!-- Type Selection (Capsules) -->
         <div class="space-y-2">
            <label class="text-xs font-bold text-gray-400 uppercase tracking-wider">Hydranten-Typ</label>
            <div class="grid grid-cols-2 gap-3" id="type-selector">
               <!-- Pillar -->
               <label class="cursor-pointer relative group">
                  <input type="radio" name="hydrant_type" value="pillar" class="peer sr-only" checked>
                  <div class="p-3 bg-gray-800 border-2 border-gray-700 rounded-xl peer-checked:border-red-500 peer-checked:bg-red-900/20 transition flex flex-col items-center gap-2 h-full">
                      <span class="text-2xl">🔥</span>
                      <span class="font-bold text-sm">Überflur</span>
                      <span class="text-[10px] text-gray-500 text-center leading-tight">Säule sichtbar</span>
                  </div>
               </label>
               
               <!-- Underground -->
               <label class="cursor-pointer relative group">
                  <input type="radio" name="hydrant_type" value="underground" class="peer sr-only">
                  <div class="p-3 bg-gray-800 border-2 border-gray-700 rounded-xl peer-checked:border-blue-400 peer-checked:bg-blue-900/20 transition flex flex-col items-center gap-2 h-full">
                      <span class="text-2xl">🕳️</span>
                      <span class="font-bold text-sm">Unterflur</span>
                      <span class="text-[10px] text-gray-500 text-center leading-tight">Im Boden (Oval)</span>
                  </div>
               </label>
            </div>
         </div>
         
         <!-- Location / Position -->
         <div class="space-y-2">
            <label class="text-xs font-bold text-gray-400 uppercase tracking-wider">Position (Lage)</label>
            <div class="grid grid-cols-2 gap-3" id="position-selector">
               <label class="cursor-pointer">
                  <input type="radio" name="position" value="sidewalk" class="peer sr-only">
                  <div class="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg peer-checked:bg-gray-700 peer-checked:text-white peer-checked:border-gray-500 text-gray-400 text-center text-sm transition">
                     Gehweg
                  </div>
               </label>
               <label class="cursor-pointer">
                  <input type="radio" name="position" value="street" class="peer sr-only">
                  <div class="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg peer-checked:bg-gray-700 peer-checked:text-white peer-checked:border-gray-500 text-gray-400 text-center text-sm transition">
                     Straße
                  </div>
               </label>
               <label class="cursor-pointer">
                  <input type="radio" name="position" value="green" class="peer sr-only">
                  <div class="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg peer-checked:bg-green-900/30 peer-checked:text-green-200 peer-checked:border-green-800 text-gray-400 text-center text-sm transition">
                     Grünstreifen
                  </div>
               </label>
               <label class="cursor-pointer">
                  <input type="radio" name="position" value="lane" class="peer sr-only">
                  <div class="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg peer-checked:bg-gray-700 peer-checked:text-white peer-checked:border-gray-500 text-gray-400 text-center text-sm transition">
                     Parkbucht
                  </div>
               </label>
            </div>
         </div>

         <!-- Simplified Inputs -->
         <div class="grid grid-cols-2 gap-4">
             <div class="space-y-1">
                 <label class="text-xs font-bold text-gray-400 uppercase">Größe (DN)</label>
                 <select id="diameter" class="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none">
                     <option value="">Unbekannt</option>
                     <option value="80">80 mm</option>
                     <option value="100">100 mm</option>
                     <option value="150">150 mm</option>
                 </select>
             </div>
             <div class="space-y-1">
                 <label class="text-xs font-bold text-gray-400 uppercase">Nummer (Ref)</label>
                 <input type="text" id="ref" placeholder="z.B. 124" class="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none placeholder-gray-600" />
             </div>
         </div>

         <!-- Color Picker -->
         <div class="space-y-2">
            <label class="text-xs font-bold text-gray-400 uppercase tracking-wider">Farbe</label>
            <div class="flex flex-wrap gap-3" id="color-picker-container">
                <!-- Will be populated by JS -->
            </div>
            <input type="hidden" id="selected_colour" value="">
         </div>

         <!-- Notes -->
         <div class="space-y-1">
             <label class="text-xs font-bold text-gray-400 uppercase">Notiz</label>
             <textarea id="note" rows="2" placeholder="Besonderheiten..." class="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none placeholder-gray-600 resize-none"></textarea>
         </div>

      </div>

      <!-- Action Footer -->
      <div class="mt-8 mb-4">
         <button id="submit-img-btn" class="w-full py-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white rounded-2xl font-bold text-lg shadow-xl shadow-red-900/30 active:scale-95 transition flex items-center justify-center gap-2">
            <span>In OSM eintragen</span>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
         </button>
         
         <div class="flex justify-between mt-4 px-2">
             <button id="retry-gps-btn" class="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 p-2">
                 <svg class="w-3 h-3 animate-spin hidden" id="gps-spin" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-width="2" d="M12 2v4m0 12v4M2 12h4m12 0h4"></path></svg>
                 📡 GPS aktualisieren
             </button>
             <div class="text-right">
                 <p class="text-xs text-gray-500 font-mono" id="gps-coords">Wait...</p>
                 <p class="text-[10px] text-gray-600 font-mono" id="gps-acc">Acquiring...</p>
             </div>
         </div>
      </div>
    </div>
  `;
}

export function initConfirmView(element, blob, location, actions, onSubmit) {
  // Preview
  const img = element.querySelector('#preview-img');
  if (blob) {
    img.src = URL.createObjectURL(blob);
    img.onload = () => img.classList.remove('opacity-0');
  }

  // Back Button
  element.querySelector('#back-to-cam').onclick = actions.back;

  // GPS Logic
  const gpsCoords = element.querySelector('#gps-coords');
  const gpsAcc = element.querySelector('#gps-acc');
  const gpsBtn = element.querySelector('#retry-gps-btn');
  const gpsSpin = element.querySelector('#gps-spin');

  const updateGPSDisplay = (loc) => {
    gpsCoords.innerText = `${loc.lat.toFixed(6)}, ${loc.lng.toFixed(6)}`;
    gpsAcc.innerText = `Genauigkeit: ±${Math.round(loc.accuracy)}m`;
  };

  if (location) updateGPSDisplay(location);

  gpsBtn.onclick = async () => {
    gpsSpin.classList.remove('hidden');
    const newLoc = await actions.retryGPS();
    gpsSpin.classList.add('hidden');
    if (newLoc) {
      location = newLoc; // Update reference
      updateGPSDisplay(newLoc);
      // Highlight success
      gpsCoords.classList.add('text-green-400');
      setTimeout(() => gpsCoords.classList.remove('text-green-400'), 1000);
    }
  };

  // COLOR PICKER LOGIC
  const colors = [
    { value: "", label: "Keine", hex: "transparent", border: "gray" },
    { value: "red", label: "Rot", hex: "#ef4444", border: "red" },
    { value: "yellow", label: "Gelb", hex: "#fbbf24", border: "yellow" },
    { value: "blue", label: "Blau", hex: "#3b82f6", border: "blue" },
    { value: "green", label: "Grün", hex: "#22c55e", border: "green" },
    { value: "orange", label: "Orange", hex: "#f97316", border: "orange" },
    { value: "white", label: "Silber/Weiß", hex: "#e5e7eb", border: "white" },
    { value: "violet", label: "Violett", hex: "#8b5cf6", border: "violet" }
  ];

  const colorContainer = element.querySelector('#color-picker-container');
  const colorInput = element.querySelector('#selected_colour');

  colors.forEach(c => {
    const btn = document.createElement('button');
    btn.className = `w-10 h-10 rounded-full border-2 flex items-center justify-center transition hover:scale-110 focus:outline-none relative`;

    // Style
    if (c.value === "") {
      btn.style.borderColor = "#4b5563"; // gray-600
      btn.innerHTML = `<span class="text-gray-500 text-xs">🚫</span>`;
    } else {
      btn.style.backgroundColor = c.hex;
      btn.style.borderColor = c.hex;
    }

    // Click Handler
    btn.onclick = () => {
      // Reset all
      Array.from(colorContainer.children).forEach(child => {
        child.classList.remove('ring-2', 'ring-white', 'scale-110');
        child.style.transform = 'scale(1)';
      });

      // Set Active
      btn.classList.add('ring-2', 'ring-white', 'scale-110');
      btn.style.transform = 'scale(1.1)';

      // Set Value
      colorInput.value = c.value;
    };

    // Set Initial (Default Empty)
    if (c.value === "") {
      btn.classList.add('ring-2', 'ring-white', 'scale-110');
    }

    colorContainer.appendChild(btn);
  });


  // Submit
  element.querySelector('#submit-img-btn').onclick = () => {
    // Collect Data
    const type = element.querySelector('input[name="hydrant_type"]:checked').value;
    const diameter = element.querySelector('#diameter').value;
    const ref = element.querySelector('#ref').value;
    const position = element.querySelector('input[name="position"]:checked')?.value || "unknown";
    const colour = colorInput.value;
    const note = element.querySelector('#note').value;

    const data = {
      lat: location.lat,
      lng: location.lng,
      type,
      diameter,
      ref,
      position,
      colour,
      note,
      blob // The image
    };

    onSubmit(data);
  };
}
