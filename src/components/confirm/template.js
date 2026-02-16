import { t } from '../../services/i18n.js';

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
        </div>

        <!-- Back Button (Floating) - Ensuring correct z-index -->
        <div class="absolute left-4 z-50" style="top: calc(0.75rem + env(safe-area-inset-top, 20px));">
           <button id="retake-btn" class="bg-black/40 backdrop-blur-md p-4 rounded-full text-white hover:bg-black/60 transition shadow-lg border border-white/10" aria-label="${t('confirm.back_btn_aria') || 'Back to Camera'}">
              <svg aria-hidden="true" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
           </button>
        </div>

        <!-- Accuracy Pill & Retry -->
        <div class="absolute right-4 z-50 flex flex-col items-end gap-2" style="top: calc(0.75rem + env(safe-area-inset-top, 20px));">
           <div class="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-white/90 border border-white/10 shadow-lg" id="geo-status-pill">
              GPS: ...
           </div>
           
           <button id="gps-retry-btn" class="bg-blue-600/80 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-bold text-white shadow-lg active:scale-95 transition hidden" aria-label="${t('confirm.retry_gps_aria') || 'Retry GPS'}">
              🔄 GPS neu laden
           </button>
        </div>

        <!-- Expand Button (Bottom Left) -->
        <div class="absolute bottom-4 left-4 z-50">
           <button id="map-expand-btn" class="bg-black/40 backdrop-blur-md p-3 rounded-full text-white hover:bg-black/60 transition shadow-lg border border-white/10" aria-label="${t('confirm.expand_map_aria') || 'Karte vergrößern'}">
              <svg aria-hidden="true" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>
           </button>
        </div>
      </div>

      <!-- Scrollable Form Content -->
      <div class="flex-grow overflow-y-auto px-4 pt-6 pb-48 space-y-8 bg-slate-900">
         
         <div class="relative mb-4 flex items-center justify-center gap-3">
            <h2 id="confirm-title" class="text-2xl font-bold text-white">${t('confirm.title') || 'Neuer Hydrant'}</h2>
            
            <!-- Delete Button Container (injected via JS if edit mode) -->
            <!-- Delete Button Container REMOVED from header -->
            <div id="delete-btn-container" class="hidden"></div>
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
                 <label class="block text-[10px] uppercase text-gray-500 mb-1 font-bold">${t('confirm.sign_label') || 'Hinweisschild'}</label>
                 <div class="grid grid-cols-3 gap-2 bg-gray-800/50 p-1 rounded-xl">
                     <button type="button" class="sign-option-btn py-2 px-1 rounded-lg text-gray-400 font-bold transition text-xs flex items-center justify-center gap-1" data-value="yes">
                        ✅ ${t('confirm.sign_options.yes') || 'Ja'}
                     </button>
                     <button type="button" class="sign-option-btn py-2 px-1 rounded-lg text-gray-400 font-bold transition text-xs flex items-center justify-center gap-1" data-value="no">
                        ❌ ${t('confirm.sign_options.no') || 'Nein'}
                     </button>
                     <button type="button" class="sign-option-btn py-2 px-1 rounded-lg text-gray-400 font-bold transition text-xs flex items-center justify-center gap-1" data-value="unknown">
                        ❓ ${t('confirm.sign_options.unknown') || 'Unbekannt'}
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

               <!-- Water Source (NEW) -->
               <div>
                  <label for="hydrant-water-source" class="block text-[10px] uppercase text-gray-500 mb-1 font-bold">${t('confirm.water_source_label') || "Wasserquelle"}</label>
                   <div class="relative">
                      <select id="hydrant-water-source" class="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white outline-none appearance-none">
                        <option value="">${t('confirm.water_source_default') || "Leitungsnetz (Standard)"}</option>
                        <option value="main">Leitungsnetz</option>
                        <option value="groundwater">Grundwasser</option>
                        <option value="pond">Teich</option>
                        <option value="lake">See</option>
                        <option value="river">Fluss</option>
                        <option value="reservoir">Speicher/Becken</option>
                      </select>
                      <!-- Custom Arrow -->
                      <div class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                   </div>
               </div>
               
               <div>
                  <label for="hydrant-note" class="block text-[10px] uppercase text-gray-500 mb-1 font-bold">${t('confirm.notes_label')}</label>
                  <textarea id="hydrant-note" placeholder="${t('confirm.notes_placeholder')}" maxlength="255" class="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white h-20 outline-none"></textarea>
               </div>
            </div>
         </div>

          <!-- DELETE BUTTON SECTION (New) -->
          <div id="delete-section" class="pt-8 pb-4 hidden">
             <button id="delete-hydrant-btn" class="w-full py-4 rounded-xl border border-red-600/30 bg-red-900/10 text-red-500 hover:bg-red-900/30 hover:border-red-500 font-bold transition flex items-center justify-center gap-2">
                <svg aria-hidden="true" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                <span>${t('confirm.delete_btn')}</span>
             </button>
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
