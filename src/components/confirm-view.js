
export function renderConfirmView() {
   return `
    <div class="h-full w-full bg-slate-900 text-white flex flex-col p-4 animate-slide-up overflow-y-auto pb-safe">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4 shrink-0">
          <button id="back-to-cam" class="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition">
             ❌
          </button>
          <h2 class="text-xl font-bold">Hydrant bestätigen</h2>
          <div class="w-10"></div> <!-- Spacer -->
      </div>
      
      <!-- Image Preview (Restored to original style) -->
      <div class="relative w-full h-64 bg-black rounded-2xl overflow-hidden mb-6 shadow-2xl shrink-0">
         <img id="preview-img" class="w-full h-full object-cover" />
         <!-- GPS Overlay restored -->
         <div class="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex justify-between items-end">
             <div class="text-xs font-mono text-gray-300">
                 <p id="gps-coords">Standort wird ermittelt...</p>
                 <p id="gps-acc" class="text-[10px] text-gray-500">Genauigkeit: ...</p>
             </div>
             <button id="retry-gps-btn" class="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition">
                 📡
                 <svg class="w-3 h-3 animate-spin hidden inline" id="gps-spin" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-width="2" d="M12 2v4m0 12v4M2 12h4m12 0h4"></path></svg>
             </button>
         </div>
      </div>
      
      <!-- Form Fields -->
      <div class="space-y-6">
         
         <!-- Type Selection (Restored Segmented Control) -->
         <div>
            <label class="block text-xs uppercase text-gray-500 font-bold mb-2">Hydranten-Typ</label>
            <div class="flex bg-gray-800 rounded-lg p-1" id="type-selector">
               <label class="flex-1 text-center py-3 rounded-md transition-all cursor-pointer bg-gray-700 text-white shadow font-bold text-sm">
                   <input type="radio" name="hydrant_type" value="pillar" class="sr-only" checked>
                   Überflur
               </label>
               <label class="flex-1 text-center py-3 rounded-md transition-all cursor-pointer text-gray-400 hover:text-white text-sm">
                   <input type="radio" name="hydrant_type" value="underground" class="sr-only">
                   Unterflur
               </label>
            </div>
         </div>
         
         <!-- Location / Position -->
         <div class="space-y-2">
            <label class="text-xs font-bold text-gray-500 uppercase tracking-wider">Position (Lage)</label>
            <div class="grid grid-cols-3 gap-2" id="position-selector">
               <label class="cursor-pointer">
                  <input type="radio" name="position" value="" class="peer sr-only" checked>
                  <div class="px-2 py-2 bg-gray-800 border border-gray-700 rounded-lg peer-checked:bg-gray-700 peer-checked:text-gray-300 peer-checked:border-gray-500 text-gray-500 text-center text-xs transition">
                     Keine Angabe
                  </div>
               </label>
               <label class="cursor-pointer">
                  <input type="radio" name="position" value="sidewalk" class="peer sr-only">
                  <div class="px-2 py-2 bg-gray-800 border border-gray-700 rounded-lg peer-checked:bg-gray-700 peer-checked:text-white peer-checked:border-gray-500 text-gray-400 text-center text-xs transition">
                     Gehweg
                  </div>
               </label>
               <label class="cursor-pointer">
                  <input type="radio" name="position" value="street" class="peer sr-only">
                  <div class="px-2 py-2 bg-gray-800 border border-gray-700 rounded-lg peer-checked:bg-gray-700 peer-checked:text-white peer-checked:border-gray-500 text-gray-400 text-center text-xs transition">
                     Straße
                  </div>
               </label>
               <label class="cursor-pointer">
                  <input type="radio" name="position" value="green" class="peer sr-only">
                  <div class="px-2 py-2 bg-gray-800 border border-gray-700 rounded-lg peer-checked:bg-green-900/30 peer-checked:text-green-200 peer-checked:border-green-800 text-gray-400 text-center text-xs transition">
                     Grünstreifen
                  </div>
               </label>
               <label class="cursor-pointer">
                  <input type="radio" name="position" value="lane" class="peer sr-only">
                  <div class="px-2 py-2 bg-gray-800 border border-gray-700 rounded-lg peer-checked:bg-gray-700 peer-checked:text-white peer-checked:border-gray-500 text-gray-400 text-center text-xs transition">
                     Parkbucht
                  </div>
               </label>
            </div>
         </div>

         <!-- Simplified Inputs (Technical Data) -->
         <div>
            <!-- Header REMOVED as requested -->
            <div class="grid grid-cols-2 gap-4">
                 <div class="space-y-1">
                     <label class="text-xs font-bold text-gray-500 uppercase">Größe (DN)</label>
                     <select id="diameter" class="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none">
                         <option value="">Unbekannt</option>
                         <option value="80">80 mm</option>
                         <option value="100">100 mm</option>
                         <option value="150">150 mm</option>
                     </select>
                 </div>
                 <div class="space-y-1">
                     <label class="text-xs font-bold text-gray-500 uppercase">Nummer (Ref)</label>
                     <input type="text" id="ref" placeholder="z.B. 124" class="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none placeholder-gray-600" />
                 </div>
            </div>
         </div>

         <!-- Color Picker -->
         <div class="space-y-2">
            <label class="text-xs font-bold text-gray-500 uppercase tracking-wider">Farbe</label>
            <div class="flex flex-wrap gap-3" id="color-picker-container">
                <!-- Will be populated by JS -->
            </div>
            <input type="hidden" id="selected_colour" value="">
         </div>

         <!-- Notes -->
         <div class="space-y-1">
             <label class="text-xs font-bold text-gray-500 uppercase">Notiz</label>
             <textarea id="note" rows="2" placeholder="Besonderheiten..." class="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none placeholder-gray-600 resize-none"></textarea>
         </div>

      </div>

      <!-- Action Footer -->
      <div class="mt-8 mb-4">
         <button id="submit-img-btn" class="w-full py-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white rounded-2xl font-bold text-lg shadow-xl shadow-red-900/30 active:scale-95 transition flex items-center justify-center gap-2">
            <span>In OSM eintragen</span>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
         </button>
      </div>
    </div>
  `;
}

export function initConfirmView(element, blob, location, actions, onSubmit) {
   // Preview
   const img = element.querySelector('#preview-img');
   if (blob) {
      img.src = URL.createObjectURL(blob);
   }

   // Back Button
   element.querySelector('#back-to-cam').onclick = actions.back;

   // Type Selector Logic (Visual Toggle)
   const typeContainer = element.querySelector('#type-selector');
   const typeInputs = typeContainer.querySelectorAll('input');
   typeInputs.forEach(input => {
      input.addEventListener('change', () => {
         typeContainer.querySelectorAll('label').forEach(lbl => {
            if (lbl.querySelector('input').checked) {
               lbl.className = "flex-1 text-center py-3 rounded-md transition-all cursor-pointer bg-gray-700 text-white shadow font-bold text-sm";
            } else {
               lbl.className = "flex-1 text-center py-3 rounded-md transition-all cursor-pointer text-gray-400 hover:text-white text-sm";
            }
         });
      });
   });

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
         gpsCoords.classList.add('text-green-400');
         setTimeout(() => gpsCoords.classList.remove('text-green-400'), 1000);
      }
   };

   // COLOR PICKER LOGIC (Corrected Palette)
   const colors = [
      { value: "black", label: "Schwarz", hex: "#000000", border: "#333" },
      { value: "grey", label: "Grau", hex: "#808080", border: "#999" },
      { value: "blue", label: "Blau", hex: "#3b82f6", border: "blue" },
      { value: "red", label: "Rot", hex: "#ef4444", border: "red" },
      { value: "yellow", label: "Gelb", hex: "#fbbf24", border: "yellow" },
      { value: "green", label: "Grün", hex: "#22c55e", border: "green" },
      { value: "white", label: "Weiß", hex: "#ffffff", border: "#ddd" }
   ];

   const colorContainer = element.querySelector('#color-picker-container');
   const colorInput = element.querySelector('#selected_colour');

   colors.forEach(c => {
      const btn = document.createElement('button');
      btn.className = `w-10 h-10 rounded-full border-2 flex items-center justify-center transition hover:scale-110 focus:outline-none relative`;

      btn.style.backgroundColor = c.hex;
      btn.style.borderColor = c.border;

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

      colorContainer.appendChild(btn);
   });

   // Default: Select nothing or let user choose. User said "First is Black".
   // Let's select Black by default? Or nothing?
   // "First make black...". 
   // Maybe he implies selecting black?
   // I'll leave it empty unless he clicks.

   // Submit
   element.querySelector('#submit-img-btn').onclick = () => {
      // Collect Data
      const type = element.querySelector('input[name="hydrant_type"]:checked').value;
      const diameter = element.querySelector('#diameter').value;
      const ref = element.querySelector('#ref').value;
      const position = element.querySelector('input[name="position"]:checked')?.value || "";
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
