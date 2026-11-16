import { t } from '../../services/i18n.js';

export function renderConfirmView() {
   return `
    <div class="hj-screen h-full w-full flex flex-col animate-fade-in pb-safe">
      <!-- Top: Map (Compact Hero 25%) -->
      <div class="relative w-full h-[25vh] bg-ink-800 shrink-0 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.9)]">
        
        <!-- MAIN: Map -->
        <div id="map" class="w-full h-full z-0"></div>

        <!-- OVERLAY: Photo (Thumbnail - Smaller) -->
        <div class="absolute bottom-4 right-4 w-20 h-28 rounded-2xl border-2 border-white/70 shadow-2xl overflow-hidden bg-black z-50 transition transform origin-bottom-right hover:scale-[2.5] active:scale-[2.5] cursor-pointer group">
            <img id="preview-img" class="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition" alt="${t('confirm.preview_alt')}" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"></div>
        </div>

        <!-- Back Button (Floating) - Ensuring correct z-index -->
        <div class="absolute left-4 z-50" style="top: calc(0.75rem + env(safe-area-inset-top, 20px));">
           <button id="retake-btn" class="hj-fab" aria-label="${t('confirm.back_btn_aria') || 'Back to Camera'}">
              <svg aria-hidden="true" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
           </button>
        </div>

        <!-- Accuracy Pill & Retry -->
        <div class="absolute right-4 z-50 flex flex-col items-end gap-2" style="top: calc(0.75rem + env(safe-area-inset-top, 20px));">
           <!-- Accuracy Pill Removed -->
           <!--
           <div class="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-white/90 border border-white/10 shadow-lg" id="geo-status-pill">
              GPS: ...
           </div>
           -->
           
           <button id="gps-retry-btn" class="hj-pill min-h-9 px-3.5 py-2 text-[11px] font-bold text-aqua-300 active:scale-95 transition hidden" aria-label="${t('confirm.retry_gps_aria')}">
              🔄 GPS neu laden
           </button>
        </div>

        <!-- Expand Button (Bottom Left) -->
        <div class="absolute bottom-4 left-4 z-50">
                       <button id="map-expand-btn" class="hj-fab" aria-label="${t('confirm.position_adjustable')}">
              <svg aria-hidden="true" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>
           </button>
        </div>
      </div>

      <!-- Scrollable Form Content -->
      <div class="custom-scrollbar flex-grow overflow-y-auto px-4 pt-6 pb-48 space-y-7">
         
         <div class="relative mb-4 flex items-center justify-center gap-3">
            <h2 id="confirm-title" class="hj-wordmark text-2xl text-white">${t('confirm.title')}</h2>
            
            <!-- Delete Button Container (injected via JS if edit mode) -->
            <!-- Delete Button Container REMOVED from header -->
            <div id="delete-btn-container" class="hidden"></div>
         </div>

         <!-- Type Selection (Grid) -->
          <div class="space-y-3">
             <h3 class="hj-eyebrow ml-1">${t('confirm.type_label')}</h3>
             
             <!-- Row 1: Main Types -->
             <div id="type-grid-main" class="grid grid-cols-2 gap-2">
                 <!-- JS Populated Main -->
             </div>
             
             <!-- Row 2: Secondary Types -->
             <div id="type-grid-secondary" class="grid grid-cols-4 gap-2">
                 <!-- JS Populated Secondary -->
             </div>
             
             <!-- SIGN Container (Moved here for proximity) -->
             <div id="sign-container" class="hidden mt-3 animate-fade-in">
                 <label class="hj-eyebrow block mb-1.5">${t('confirm.sign_label')}</label>
                 <div class="hj-seg grid grid-cols-3 gap-1">
                     <button type="button" class="sign-option-btn hj-seg-btn min-h-[44px] px-1 text-xs flex items-center justify-center gap-1" data-value="yes">
                        ✅ ${t('confirm.sign_options.yes')}
                     </button>
                     <button type="button" class="sign-option-btn hj-seg-btn min-h-[44px] px-1 text-xs flex items-center justify-center gap-1" data-value="no">
                        ❌ ${t('confirm.sign_options.no')}
                     </button>
                     <button type="button" class="sign-option-btn hj-seg-btn min-h-[44px] px-1 text-xs flex items-center justify-center gap-1" data-value="unknown">
                        ❓ ${t('confirm.sign_options.unknown')}
                     </button>
                 </div>
                 <input type="hidden" id="hydrant-sign" value="unknown">
             </div>

             <input type="hidden" id="hydrant-type" value="pillar">
          </div>

         <!-- Position Selection -->
         <div id="position-container" class="space-y-3">
             <h3 class="hj-eyebrow ml-1">${t('confirm.position_label')}</h3>
             <div class="hj-seg grid grid-cols-5 gap-1">
                 <button type="button" class="pos-option-btn hj-seg-btn min-h-[44px] min-w-0 px-0.5 text-[10px] tracking-tight leading-tight flex flex-col items-center justify-center gap-0.5 py-1.5" data-value="">
                    <span class="text-base leading-none" aria-hidden="true">🚫</span><span class="max-w-full hyphens-auto [overflow-wrap:anywhere]">${t('confirm.locations.none')}</span>
                 </button>
                <button type="button" class="pos-option-btn hj-seg-btn min-h-[44px] min-w-0 px-0.5 text-[10px] tracking-tight leading-tight flex flex-col items-center justify-center gap-0.5 py-1.5" data-value="sidewalk">
                   <span class="text-base leading-none" aria-hidden="true">🚶</span><span class="max-w-full hyphens-auto [overflow-wrap:anywhere]">${t('confirm.locations.sidewalk')}</span>
                </button>
                <button type="button" class="pos-option-btn hj-seg-btn min-h-[44px] min-w-0 px-0.5 text-[10px] tracking-tight leading-tight flex flex-col items-center justify-center gap-0.5 py-1.5" data-value="lane">
                   <span class="text-base leading-none" aria-hidden="true">🚗</span><span class="max-w-full hyphens-auto [overflow-wrap:anywhere]">${t('confirm.locations.street')}</span>
                </button>
                <button type="button" class="pos-option-btn hj-seg-btn min-h-[44px] min-w-0 px-0.5 text-[10px] tracking-tight leading-tight flex flex-col items-center justify-center gap-0.5 py-1.5" data-value="parking_lane">
                   <span class="text-base leading-none" aria-hidden="true">🅿️</span><span class="max-w-full hyphens-auto [overflow-wrap:anywhere]">${t('confirm.locations.parking')}</span>
                </button>
                <button type="button" class="pos-option-btn hj-seg-btn min-h-[44px] min-w-0 px-0.5 text-[10px] tracking-tight leading-tight flex flex-col items-center justify-center gap-0.5 py-1.5" data-value="green">
                   <span class="text-base leading-none" aria-hidden="true">🌳</span><span class="max-w-full hyphens-auto [overflow-wrap:anywhere]">${t('confirm.locations.green')}</span>
                </button>
             </div>
             <input type="hidden" id="hydrant-position" value="sidewalk">
         </div>

         <!-- Details (Visible) -->
         <div class="hj-card space-y-4 p-4">
            
            <!-- Diameter / Volume -->
             <div id="diameter-container">
                 <label for="hydrant-diameter" class="hj-eyebrow block mb-1.5">${t('confirm.diameter_label')}</label>
                 <!-- Using type="tel" to trigger numeric keypad on mobile but avoid spinner arrows -->
                  <input type="tel" inputmode="numeric" pattern="[0-9]*" id="hydrant-diameter" placeholder="${t('confirm.diameter_placeholder')}" class="hj-input appearance-none">
             </div>

            <div id="volume-container" class="hidden">
                <label for="hydrant-volume" class="hj-eyebrow block mb-1.5">Volumen (m³)</label>
                <input type="text" id="hydrant-volume" placeholder="${t('confirm.volume_placeholder')}" class="hj-input">
            </div>

            <div id="aed-details-container" class="hidden space-y-4 rounded-2xl border border-emerald-400/25 bg-emerald-500/[0.07] p-4">
                <h3 class="hj-eyebrow text-emerald-300">${t('confirm.aed_details')}</h3>
                <div>
                    <label for="aed-access" class="hj-eyebrow block mb-1.5">${t('confirm.aed_access')}</label>
                    <select id="aed-access" class="hj-input">
                        <option value="">${t('confirm.aed_unspecified')}</option>
                        <option value="yes">${t('confirm.aed_access_public')}</option>
                        <option value="no">${t('confirm.aed_access_no')}</option>
                        <option value="permissive">${t('confirm.aed_access_permissive')}</option>
                        <option value="customers">${t('confirm.aed_access_customers')}</option>
                        <option value="destination">${t('confirm.aed_access_destination')}</option>
                        <option value="private">${t('confirm.aed_access_private')}</option>
                    </select>
                </div>
                <div>
                    <label for="aed-indoor" class="hj-eyebrow block mb-1.5">${t('confirm.aed_indoor')}</label>
                    <select id="aed-indoor" class="hj-input">
                        <option value="">${t('confirm.aed_unspecified')}</option>
                        <option value="yes">${t('confirm.sign_options.yes')}</option>
                        <option value="no">${t('confirm.sign_options.no')}</option>
                    </select>
                </div>
                <div>
                    <label for="aed-opening-hours" class="hj-eyebrow block mb-1.5">${t('confirm.aed_opening_hours')}</label>
                    <input type="text" id="aed-opening-hours" placeholder="${t('confirm.aed_opening_hours_placeholder')}" maxlength="120" class="hj-input">
                </div>
            </div>

            <div class="space-y-4">
               <!-- SIGN Container removed from here -->
               
               <div id="ref-container">
                  <label id="hydrant-ref-label" for="hydrant-ref" class="hj-eyebrow block mb-1.5">${t('confirm.number_label')}</label>
                  <input type="text" id="hydrant-ref" placeholder="${t('confirm.number_placeholder')}" maxlength="50" class="hj-input">
               </div>

               <!-- Water Source (NEW) -->
               <div id="water-source-container">
                  <label for="hydrant-water-source" class="hj-eyebrow block mb-1.5">${t('confirm.water_source_label')}</label>
                   <div class="relative">
                      <select id="hydrant-water-source" class="hj-input appearance-none">
                        <option value="">${t('confirm.water_source_default')}</option>
                        <option value="main">${t('confirm.water_source_main')}</option>
                        <option value="groundwater">${t('confirm.water_source_groundwater')}</option>
                        <option value="pond">${t('confirm.water_source_pond')}</option>
                        <option value="lake">${t('confirm.water_source_lake')}</option>
                        <option value="river">${t('confirm.water_source_river')}</option>
                        <option value="reservoir">${t('confirm.water_source_reservoir')}</option>
                      </select>
                      <!-- Custom Arrow -->
                      <div class="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-white/50">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                   </div>
               </div>
               
               <div>
                  <label for="hydrant-note" class="hj-eyebrow block mb-1.5">${t('confirm.notes_label')}</label>
                  <textarea id="hydrant-note" placeholder="${t('confirm.notes_placeholder')}" maxlength="255" class="hj-input h-24 resize-none"></textarea>
               </div>
            </div>
         </div>

          <!-- DELETE BUTTON SECTION (New) -->
          <div id="delete-section" class="pt-8 pb-4 hidden">
             <button id="delete-hydrant-btn" class="hj-btn hj-btn-danger w-full">
                <svg aria-hidden="true" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                <span>${t('confirm.delete_btn')}</span>
             </button>
          </div>
      </div>

      <!-- Submit Footer (Raised) -->
      <div class="fixed bottom-0 left-0 right-0 p-4 pb-20 bg-gradient-to-t from-ink-900 via-ink-900/95 to-transparent z-50 max-w-sm mx-auto">
         <button id="submit-img-btn" class="hj-btn hj-btn-success w-full min-h-[3.75rem] text-lg">
            <span>${t('confirm.upload_btn')}</span>
         </button>
      </div>
    </div>
  `;
}
