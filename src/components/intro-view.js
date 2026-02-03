import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
// Fix for Leaflet default icon issues in Vite/Webpack
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { getLastKnownPosition, updatePosition } from '../services/geo.js';

import { overpass } from '../services/overpass.js';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
   iconRetinaUrl: markerIcon2x,
   iconUrl: markerIcon,
   shadowUrl: markerShadow,
});

// Globals for Hydrants
const visibleHydrants = new Set();
let hydrantLayer = null;

import { t, lang, setLanguage } from '../services/i18n.js';

export function renderIntroView() {
   // Check Login Status
   let loginText = t('intro.login_osm');
   let loginClass = "text-gray-400 hover:text-white";

   try {
      const token = JSON.parse(localStorage.getItem('osm-auth') || '{}');
      if (token.access_token) {
         const name = localStorage.getItem('osm_user_name') || t('intro.login_connected');
         const img = localStorage.getItem('osm_user_img');

         if (img) {
            // Show Avatar
            loginText = `<img src="${img}" class="w-6 h-6 rounded-full border border-green-400" alt="${name}"> <span class="truncate max-w-[100px]">${name}</span>`;
         } else {
            loginText = `✅ ${name}`;
         }

         loginClass = "text-green-400 hover:text-green-300 font-bold";
      }
   } catch (e) { }

   return `
    <div class="h-full w-full bg-black text-white flex flex-col relative overflow-hidden">
      
      <!-- Top 30% Map -->
      <div class="w-full h-[30%] shrink-0 relative z-0">
          <div id="intro-map" class="w-full h-full"></div>
          <!-- Gradient Overlay -->
          <div class="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black to-transparent pointer-events-none"></div>
      </div>

      <!-- Content (Bottom 70%) -->
      <div class="flex-grow flex flex-col items-center z-10 w-full max-w-sm mx-auto px-6 overflow-y-auto pb-4">
         
         <!-- Hero Title -->
         <div class="text-center mt-6 mb-8">
             <h1 class="text-4xl font-extrabold text-white mb-2 tracking-tight drop-shadow-xl">
                Hydranten <span class="text-red-500">Jäger</span>
             </h1>
             ${lang !== 'de' ? `<p class="text-sm text-gray-400 font-medium tracking-wide uppercase opacity-80 mt-1">${t('intro.title_pre')} ${t('intro.title_post')}</p>` : ''}
         </div>

         <!-- Instructions Card -->
         <div class="w-full bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 space-y-3 text-sm text-gray-300 shadow-xl">
             <div class="flex items-center gap-4">
                <span class="text-xl bg-white/10 p-2 rounded-lg">📏</span> <p><span class="text-white font-bold">${t('intro.step1_bold')}</span> ${t('intro.step1').replace(t('intro.step1_bold'), '')}</p>
             </div>
             <div class="flex items-center gap-4">
                <span class="text-xl bg-white/10 p-2 rounded-lg">📸</span> <p><span class="text-white font-bold">${t('intro.step2_bold')}</span> ${t('intro.step2').replace(t('intro.step2_bold'), '')}</p>
             </div>
             <div class="flex items-center gap-4">
                <span class="text-xl bg-white/10 p-2 rounded-lg">✏️</span> <p><span class="text-white font-bold">${t('intro.step3_bold')}</span> ${t('intro.step3').replace(t('intro.step3_bold'), '')}</p>
             </div>
             <div class="flex items-center gap-4">
                <span class="text-xl bg-white/10 p-2 rounded-lg">☁️</span> <p><span class="text-white font-bold">${t('intro.step4_bold')}</span> ${t('intro.step4').replace(t('intro.step4_bold'), '')}</p>
             </div>
         </div>
      </div>

      <!-- Footer Action -->
      <div class="h-auto shrink-0 z-10 w-full max-w-sm mx-auto flex flex-col justify-end px-6 pb-24">
          <button id="start-btn" class="w-full py-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white rounded-2xl font-bold text-lg shadow-xl shadow-red-900/30 active:scale-95 transition-all flex items-center justify-center gap-2 mb-4">
             ${t('intro.start_btn')}
          </button>
          
          <div class="flex items-center gap-3">
              <!-- Language Flag -->
              <button id="lang-btn" class="w-12 h-10 shrink-0 rounded-xl bg-white/5 text-2xl hover:bg-white/10 transition flex items-center justify-center border border-white/10" aria-label="${t('intro.lang_btn_aria') || 'Language / Sprache'}">
                🇩🇪
              </button>

              <button id="intro-settings-btn" class="flex-grow py-3 flex items-center justify-center gap-2 ${loginClass} transition-colors text-sm font-medium hover:bg-white/5 rounded-xl">
                 ${!loginText.includes('<img') ? `<svg aria-hidden="true" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>` : ''}
                 ${loginText}
              </button>
              <button id="intro-info-btn" class="w-10 h-10 shrink-0 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition flex items-center justify-center border border-white/10" aria-label="Information & Legal">
                <span class="font-serif italic font-bold text-lg" aria-hidden="true">i</span>
              </button>
          </div>
          
          <div class="mt-4 text-center">
             <a href="https://www.openstreetmap.org/copyright" target="_blank" class="text-[10px] text-gray-500 hover:text-gray-300 transition no-underline">
                © OpenStreetMap contributors
             </a>
          </div>
         
    
    </div>
   `;
}

// Debounce Helper
function debounce(func, wait) {
   let timeout;
   return function executedFunction(...args) {
      const later = () => {
         clearTimeout(timeout);
         func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
   };
}

export function initIntroView(element, onStart, onSettings, onEdit) {
   // ... existing event listeners ...
   const btn = element.querySelector('#start-btn');
   if (btn) {
      // ... existing start logic ...
      btn.onclick = () => {
         const startApp = () => {
            import('../services/geo.js').then(geo => {
               geo.initCompass();
               geo.startTracking();
               onStart();
            });
         };

         if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission()
               .then(response => {
                  // ...
               })
               .catch(console.error)
               .finally(() => startApp());
         } else {
            startApp();
         }
      };
   }

   const settingsBtn = element.querySelector('#intro-settings-btn');
   if (settingsBtn && onSettings) settingsBtn.onclick = onSettings;

   // Info Modal Logic
   const infoBtn = element.querySelector('#intro-info-btn');
   if (infoBtn) {
      // ... existing info modal logic ...
      infoBtn.onclick = () => {
         const modal = document.createElement('div');
         modal.className = "absolute inset-0 z-50 flex items-center justify-center bg-black/90 p-6 animate-fade-in backdrop-blur-md";
         modal.innerHTML = `
             <div class="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl overflow-y-auto max-h-[80vh]">
                 <h3 class="text-xl font-bold text-white mb-4">${t('intro.info_legal')}</h3>
                 
                 <div class="space-y-4 text-sm text-gray-300">
                     <p><strong>${t('intro.title_pre')} ${t('intro.title_post')}</strong> (v1.3.0)</p>
                    
                    <div class="border-l-2 border-gray-600 pl-3 py-1">
                        <h4 class="font-bold text-white mb-1">${t('intro.info_impressum')}</h4>
                        <p class="text-xs text-gray-400 mb-1">Angaben gemäß § 5 TMG:</p>
                        <p>Frank März</p>
                        <p>Kersbacher Weg 3</p>
                        <p>91220 Schnaittach</p>
                        <p>Deutschland</p>
                        <br>
                        <p><strong>Kontakt:</strong></p>
                        <p>Tel: +499153/9229501</p>
                        <p>E-Mail: info@openfiremap.org</p>
                    </div>
                     
                     <div>
                         <h4 class="font-bold text-white">${t('intro.info_data')}</h4>
                         <p>${t('intro.info_data_text')}</p>
                     </div>

                     <div>
                         <h4 class="font-bold text-white">${t('intro.info_license')}</h4>
                         <p>Data <a href="https://www.openstreetmap.org/copyright" target="_blank" class="text-blue-400 hover:text-blue-300 underline">© OpenStreetMap contributors</a>.</p>
                         <p>Code: MIT License</p>
                         <a href="https://github.com/FrnkMrz/hydranten-app" target="_blank" class="text-blue-400 hover:text-blue-300 underline mt-1 block">
                             📂 ${t('intro.info_github')}
                         </a>
                     </div>
                 </div>

                 <button id="close-intro-info-btn" class="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition">
                     OK
                 </button>
             </div>
           `;
         element.appendChild(modal);
         modal.querySelector('#close-intro-info-btn').onclick = () => modal.remove();
      };
   }

   // Language Switcher Logic
   const langBtn = element.querySelector('#lang-btn');
   if (langBtn) {
      const flags = {
         'de': '🇩🇪', 'en': '🇬🇧', 'pl': '🇵🇱', 'cs': '🇨🇿',
         'fr': '🇫🇷', 'nl': '🇳🇱', 'es': '🇪🇸', 'pt': '🇵🇹',
         'hr': '🇭🇷', 'it': '🇮🇹', 'ja': '🇯🇵', 'ko': '🇰🇷', 'zh': '🇨🇳', 'tr': '🇹🇷'
      };

      langBtn.innerText = flags[lang] || '🌐';

      langBtn.onclick = () => {
         const modal = document.createElement('div');
         modal.className = "absolute inset-0 z-50 flex items-center justify-center bg-black/90 p-6 animate-fade-in backdrop-blur-md";

         const langs = [
            { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
            { code: 'en', label: 'English', flag: '🇺🇸' },
            { code: 'pl', label: 'Polski', flag: '🇵🇱' },
            { code: 'cs', label: 'Čeština', flag: '🇨🇿' },
            { code: 'fr', label: 'Français', flag: '🇫🇷' },
            { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
            { code: 'es', label: 'Español', flag: '🇪🇸' },
            { code: 'pt', label: 'Português', flag: '🇵🇹' },
            { code: 'hr', label: 'Hrvatski', flag: '🇭🇷' },
            { code: 'it', label: 'Italiano', flag: '🇮🇹' },
            { code: 'ja', label: '日本語', flag: '🇯🇵' },
            { code: 'ko', label: '한국어', flag: '🇰🇷' },
            { code: 'zh', label: '中文', flag: '🇨🇳' },
            { code: 'tr', label: 'Türkçe', flag: '🇹🇷' }
         ];

         modal.innerHTML = `
               <div class="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                   <h3 class="text-xl font-bold text-white mb-4 text-center">Language / Sprache</h3>
                   <div class="grid grid-cols-2 gap-3">
                       ${langs.map(l => `
                           <button class="lang-option p-3 rounded-xl bg-white/5 hover:bg-white/10 transition border border-white/10 flex items-center gap-3 ${lang === l.code ? 'border-green-500 bg-green-900/20' : ''}" data-code="${l.code}">
                               <span class="text-2xl">${l.flag}</span>
                               <span class="text-white font-bold text-sm">${l.label}</span>
                           </button>
                       `).join('')}
                   </div>
                   <button id="close-lang-btn" class="w-full mt-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-xl font-bold transition">
                       Cancel
                   </button>
               </div>
           `;

         element.appendChild(modal);

         modal.querySelectorAll('.lang-option').forEach(btn => {
            btn.onclick = () => {
               setLanguage(btn.dataset.code);
            };
         });

         modal.querySelector('#close-lang-btn').onclick = () => modal.remove();
      };
   }

   // Reset cached markers on mount to force redraw on the new map instance
   if (visibleHydrants) visibleHydrants.clear();
   // Reset global layer reference if needed, though it's overwritten below
   hydrantLayer = null;
   // Live GPS Update & Map
   const mapContainer = element.querySelector('#intro-map');
   let map = null;
   let marker = null;

   // Init Cached Position immediately
   const lastPos = getLastKnownPosition();
   const initialCenter = lastPos ? [lastPos.lat, lastPos.lng] : [48.137, 11.576];
   // Fix: Increase default zoom to 16 so that hydrate fetch (min 14) works even without GPS fix
   const initialZoom = lastPos ? 18 : 16;

   // Keep track of marker globally within this scope (closure) for updates
   let userMarker = null; // Re-introduced

   if (mapContainer && !map) {
      // Initialize Map
      const mapElement = element.querySelector('#intro-map');
      if (mapElement && !mapElement._leaflet_id) {
         map = L.map(mapElement, {
            zoomControl: false,
            attributionControl: false,
            dragging: false, // Wait, maybe we should allow dragging in Intro? No, user said no dragging.
            scrollWheelZoom: false,
            doubleClickZoom: false,
            touchZoom: false,
            boxZoom: false,
            keyboard: false,
            zoomSnap: 0,
         }).setView([51.1657, 10.4515], 6); // Default Germany

         L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            opacity: 0.8 // Slightly dimmed to match dark UI, or 1.0? Old code had 0.8.
         }).addTo(map);

         // Initial Hydrant Layer
         hydrantLayer = L.layerGroup().addTo(map);

         // Watch GPS to update map & fetch hydrants
         // FIX: Do not auto-request. Only if we have permission or on user interaction.
         // We check 'permissions' API if available, else we wait.
         // Check 'permissions' API to auto-start if already granted
         // This restores "Show my position" for returning users without triggering new prompts.
         // Always attempt to start GPS on load to ensure we get a fix.
         // This might trigger the permission prompt if not granted, which is desired behavior now.
         startMapGps(map, (lat, lng) => {
            if (!userMarker) {
               userMarker = L.marker([lat, lng]).addTo(map);
            } else {
               userMarker.setLatLng([lat, lng]);
            }
         }, onEdit);

         // Debounced Map Move Handler
         // Pass onEdit here!
         const debouncedUpdate = debounce(() => updateHydrants(map, onEdit), 1000);

         // Let's just hook into moveend if the map MOVES (even programmatically).
         map.on('moveend', debouncedUpdate);
      }

      // Force a resize invalidation shortly after render to ensure map fills container
      setTimeout(() => {
         map.invalidateSize();

         // Fix: Check if we have a valid last known position to restore
         if (lastPos && lastPos.lat && lastPos.lng) {
            // Restore view without animation to be instant
            map.setView([lastPos.lat, lastPos.lng], 18, { animate: false });

            if (!userMarker) userMarker = L.marker([lastPos.lat, lastPos.lng]).addTo(map);
            else userMarker.setLatLng([lastPos.lat, lastPos.lng]);

            // Force immediate update now that view is set
            console.log("Restoring view -> Force update hydrants");
            updateHydrants(map, onEdit);
         } else {
            // If no position, we rely on the GPS fix or default view
            updateHydrants(map, onEdit);
         }
      }, 300); // Increased delay slightly to 300ms to be safe against render jank
   }

   // Return Cleanup Function (Stub for now, real cleanup in startMapGps logic if needed)
   return () => { };
}

// Extracted GPS start logic
function startMapGps(map, onLocationFound, onEdit) {
   if (!navigator.geolocation) return;

   // Single fetch for center
   navigator.geolocation.getCurrentPosition(pos => {
      const { latitude, longitude } = pos.coords;
      map.setView([latitude, longitude], 18);
      // We don't call updateHydrants here because moveend will trigger it?
      updateHydrants(map, onEdit); // Triggered by setView -> moveend
      updatePosition(pos); // Cache it

      if (onLocationFound) onLocationFound(latitude, longitude);

   }, err => console.log("Intro GPS error", err), { enableHighAccuracy: true });

   // Watcher
   // Note: We don't store watchId here globally properly yet, but avoiding the violation is priority.
   // In a real app, we'd bind this to the component state.
}


// Helper to fetch and draw
function updateHydrants(map, onEdit) {
   if (map.getZoom() < 14) return; // Don't fetch for whole world
   console.log("Hydrant Update. onEdit available?", !!onEdit); // DEBUG

   overpass.fetchHydrants(map.getBounds())
      .then(elements => {
         if (!hydrantLayer) return;

         // Optimistic Filter: Remove hydrants that we know are deleted locally
         let localDeleted = [];
         let localCreated = [];
         try {
            localDeleted = JSON.parse(localStorage.getItem('deleted_hydrants') || '[]');
            localCreated = JSON.parse(localStorage.getItem('created_hydrants') || '[]');

            // Cleanup Created: Remove items older than 15 minutes or arguably if they appear in API (handled below)
            const now = Date.now();
            const validCreated = localCreated.filter(n => (now - (n.timestamp || 0)) < 15 * 60 * 1000);
            if (validCreated.length !== localCreated.length) {
               localStorage.setItem('created_hydrants', JSON.stringify(validCreated));
               localCreated = validCreated;
            }
         } catch (e) { }

         // 1. Filter out deleted
         let filteredElements = elements.filter(node => !localDeleted.includes(String(node.id)));

         // 2. Inject local/newly created hydrants (if not already present)
         const existingIds = new Set(filteredElements.map(n => String(n.id)));
         let injectedCount = 0;

         localCreated.forEach(localNode => {
            // Check bounds (roughly) to only add if in view? 
            // Or just add them, Leaflet handles off-screen fine usually, but Overpass query was bounded.
            // Let's checks bounds to be nice.
            if (map.getBounds().contains([localNode.lat, localNode.lon])) {
               // Fix: Ensure we don't re-inject if it was deleted locally!
               if (!localDeleted.includes(String(localNode.id))) {
                  if (!existingIds.has(String(localNode.id))) {
                     filteredElements.push(localNode);
                     injectedCount++;
                  }
               }
            }
         });

         console.log(`Fetched ${elements.length}, Deleted ${elements.length - filteredElements.length + injectedCount}, Injected ${injectedCount} locals. Showing ${filteredElements.length}`);

         // Jäger Red (Tailwind red-600) = #DC2626
         const RED = '#DC2626';
         // Blue for Suction Points (Tailwind blue-600) = #2563EB
         const BLUE = '#2563EB';

         filteredElements.forEach(node => {
            if (!node.lat || !node.lon) return;

            if (!visibleHydrants.has(node.id)) {
               visibleHydrants.add(node.id);

               // Determine color based on tags
               let fillColor = RED;
               const isSuction = node.tags && (
                  node.tags.emergency === 'suction_point' ||
                  node.tags.emergency === 'water_tank' ||
                  node.tags['fire_hydrant:type'] === 'suction_point' ||
                  node.tags['fire_hydrant:type'] === 'cistern'
               );

               if (isSuction) {
                  fillColor = BLUE;
               }

               const m = L.circleMarker([node.lat, node.lon], {
                  radius: 8, // Slightly bigger for easier tap
                  fillColor: fillColor,
                  color: '#fff',
                  weight: 2,
                  opacity: 0.9,
                  fillOpacity: 0.7,
                  className: 'hydrant-marker cursor-pointer'
               });

               // Fix: Ensure marker is added to layer!
               m.addTo(hydrantLayer);

               m.on('click', () => {
                  console.log("Clicked Hydrant:", node.id, "onEdit:", onEdit); // DEBUG
                  // Visual feedback
                  m.setStyle({ fillColor: '#3b82f6', radius: 10, color: 'white', weight: 4 });
                  setTimeout(() => {
                     if (onEdit) {
                        onEdit(node.id); // Trigger Edit Mode
                     } else {
                        console.error("onEdit is MISSING in click handler!");
                        alert("Interner Fehler: Edit-Funktion fehlt.");
                     }
                     // Reset style handled by re-render usually, but let's be nice
                     // m.setStyle({ fillColor: RED, radius: 8, weight: 2 });
                  }, 100);
               });

               m.addTo(hydrantLayer);
            }
         });
      })
      .catch(err => {
         console.warn("Hydranten konnten nicht geladen werden:", err);
         const status = document.getElementById('geo-status-pill');
         if (status) status.innerText = "Netzwerkfehler";
      });
}
