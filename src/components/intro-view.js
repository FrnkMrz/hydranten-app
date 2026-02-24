import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
// Fix for Leaflet default icon issues in Vite/Webpack
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { getLastKnownPosition, updatePosition, getPosition, initCompass, startTracking, hasCompassAccess } from '../services/geo.js';

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
import { escapeHTML } from '../utils/security.js';
import { APP_VERSION } from '../version.js';

export function renderIntroView() {
   // Check Login Status
   let loginText = t('intro.login_osm');
   let loginClass = "text-gray-400 hover:text-white";

   try {
      const token = JSON.parse(localStorage.getItem('osm-auth') || '{}');
      if (token.access_token) {
         let name = localStorage.getItem('osm_user_name') || t('intro.login_connected');

         // Security: Escape HTML special chars to prevent XSS from usernames
         // Security: Escape HTML special chars to prevent XSS from usernames
         name = escapeHTML(name);

         const img = localStorage.getItem('osm_user_img');
         // We trust img URL as it is validated by browser when setting src, 
         // and CSP restricts sources.

         if (img) {
            // Show Avatar
            loginText = `<img src="${escapeHTML(img)}" class="w-6 h-6 rounded-full border border-green-400" alt="${name}"> <span class="truncate max-w-[100px]">${name}</span>`;
         } else {
            loginText = `✅ ${name}`;
         }

         loginClass = "text-green-400 hover:text-green-300 font-bold";
      }
   } catch (_e) { /* ignore */ }

   return `
    <div class="h-full w-full bg-black text-white flex flex-col relative overflow-hidden">
      
      <!-- Map - Fills remaining space (flex-grow) -->
      <div class="w-full flex-grow min-h-[30%] relative z-0">
          <div id="intro-map" class="w-full h-full"></div>
          
          <!-- LOCATE ME BUTTON -->
          <button id="locate-me-btn" class="absolute bottom-6 right-4 z-[401] bg-blue-600/90 text-white p-3 rounded-full shadow-lg shadow-blue-900/40 border border-white/20 active:scale-95 hover:bg-blue-500 transition" aria-label="Locate Me">
            <svg class="w-6 h-6 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          </button>

          <!-- EDIT BUTTON (Initial Hidden) -->
          <button id="edit-mode-btn" class="hidden absolute bottom-6 left-4 z-[401] bg-white/90 text-gray-800 p-3 rounded-full shadow-lg border border-gray-200 active:scale-95 hover:bg-white transition" aria-label="Edit Mode">
            <svg class="w-6 h-6 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
          </button>

          <!-- CLOSE FULLSCREEN BUTTON (Hidden) -->
          <button id="close-fullscreen-btn" class="hidden absolute top-safe-4 left-4 z-[402] bg-black/50 text-white p-3 rounded-full shadow-lg backdrop-blur-md border border-white/20 active:scale-95 hover:bg-black/70 transition" aria-label="Close Map">
            <svg class="w-6 h-6 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>

          <!-- Gradient Overlay -->
          <div class="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none"></div>
      </div>

      <!-- Bottom Sheet Content - Auto Height, Stacked -->
      <div class="w-full shrink-0 z-10 bg-black flex flex-col items-center px-6 pb-8 pt-2 rounded-t-3xl -mt-6 relative shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
         
         <!-- Drag Handle / Visual Indicator -->
         <div class="w-12 h-1.5 bg-gray-800 rounded-full mb-6"></div>

         <!-- Hero Title -->
         <div class="text-center mb-6 w-full">
             <h1 class="text-4xl font-extrabold text-white mb-2 tracking-tight drop-shadow-xl">
                Hydranten <span class="text-red-500">Jäger</span>
             </h1>
             ${lang !== 'de' ? `<p class="text-sm text-gray-400 font-medium tracking-wide uppercase opacity-80 mt-1">${t('intro.title_pre')} ${t('intro.title_post')}</p>` : ''}
         </div>

         <!-- Instructions Card -->
         <div class="w-full max-w-md bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 space-y-4 text-base text-gray-300 shadow-xl mb-6">
             <div class="flex items-center gap-4">
                <span class="text-2xl bg-white/10 p-2 rounded-lg">📏</span> <p class="leading-snug"><span class="text-white font-bold text-lg">${t('intro.step1_bold')}</span><br>${t('intro.step1').replace(t('intro.step1_bold'), '')}</p>
             </div>
             <div class="flex items-center gap-4">
                <span class="text-2xl bg-white/10 p-2 rounded-lg">📸</span> <p class="leading-snug"><span class="text-white font-bold text-lg">${t('intro.step2_bold')}</span><br>${t('intro.step2').replace(t('intro.step2_bold'), '')}</p>
             </div>
             <div class="flex items-center gap-4">
                <span class="text-2xl bg-white/10 p-2 rounded-lg">✏️</span> <p class="leading-snug"><span class="text-white font-bold text-lg">${t('intro.step3_bold')}</span><br>${t('intro.step3').replace(t('intro.step3_bold'), '')}</p>
             </div>
             <div class="flex items-center gap-4">
                <span class="text-2xl bg-white/10 p-2 rounded-lg">☁️</span> <p class="leading-snug"><span class="text-white font-bold text-lg">${t('intro.step4_bold')}</span><br>${t('intro.step4').replace(t('intro.step4_bold'), '')}</p>
             </div>
         </div>

         <!-- Start Button -->
         <button id="start-btn" class="w-full max-w-md py-5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white rounded-2xl font-bold text-xl shadow-xl shadow-red-900/30 active:scale-95 transition-all flex items-center justify-center gap-2 mb-6">
             ${t('intro.start_btn')}
         </button>
          
         <!-- Footer Actions -->
         <div class="flex items-center gap-3 w-full max-w-md">
              <button id="lang-btn" class="w-14 h-12 shrink-0 rounded-xl bg-white/5 text-3xl hover:bg-white/10 transition flex items-center justify-center border border-white/10" aria-label="${t('intro.lang_btn_aria') || 'Language / Sprache'}">
                🇩🇪
              </button>

              <button id="intro-settings-btn" class="flex-grow h-12 flex items-center justify-center gap-2 ${loginClass} transition-colors text-base font-medium hover:bg-white/5 rounded-xl border border-transparent hover:border-white/10">
                 ${!loginText.includes('<img') ? `<svg aria-hidden="true" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>` : ''}
                 ${loginText}
              </button>
              <button id="intro-info-btn" class="w-12 h-12 shrink-0 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition flex items-center justify-center border border-white/10" aria-label="Information & Legal">
                <span class="font-serif italic font-bold text-xl" aria-hidden="true">i</span>
              </button>
         </div>
          
         <div class="mt-4 text-center">
             <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" class="text-[10px] text-gray-600 hover:text-gray-400 transition no-underline block">
                © OpenStreetMap contributors
             </a>
         </div>
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
         // UI Feedback
         // const originalText = btn.innerHTML;
         btn.innerHTML = '<svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> ' + btn.innerText;
         btn.classList.add('opacity-75', 'cursor-wait', 'pointer-events-none');

         const startApp = () => {
            // Step 1: Force immediate fresh GPS update
            getPosition(true).then(pos => {
               updatePosition({ coords: { latitude: pos.lat, longitude: pos.lng, accuracy: pos.accuracy, heading: pos.heading } });
            }).catch(console.warn).finally(() => {
               initCompass();
               startTracking();
               onStart();
            });
         };

         if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            // Step 4: Skip prompt if we already have access
            if (hasCompassAccess()) {
               console.log("Compass access already granted, skipping prompt.");
               startApp();
            } else {
               DeviceOrientationEvent.requestPermission()
                  .then(response => {
                     if (response === 'granted') {
                        // good
                     }
                  })
                  .catch(console.error)
                  .finally(() => startApp());
            }
         } else {
            startApp();
         }
      };
   }

   const settingsBtn = element.querySelector('#intro-settings-btn');
   if (settingsBtn && onSettings) settingsBtn.onclick = onSettings;

   // NEW: Edit Mode / Fullscreen Toggle
   const editBtn = element.querySelector('#edit-mode-btn');
   const closeFsBtn = element.querySelector('#close-fullscreen-btn');
   const mapWrapper = element.querySelector('#intro-map').parentElement;
   const locateBtn = element.querySelector('#locate-me-btn');

   if (editBtn) {
      editBtn.onclick = () => {
         // Enter Fullscreen
         mapWrapper.classList.remove('relative', 'flex-grow'); // Remove constraints
         mapWrapper.classList.add('fixed', 'inset-0', 'z-[500]', 'bg-black');

         editBtn.classList.add('hidden');
         closeFsBtn.classList.remove('hidden');

         // Adjust Buttons for Safe Area (Fullscreen only)
         if (locateBtn) {
            locateBtn.classList.remove('bottom-6');
            locateBtn.classList.add('bottom-safe-6');
         }
         // editBtn is hidden, so no need to adjust its bottom, but good practice if resurrected
         editBtn.classList.remove('bottom-6');
         editBtn.classList.add('bottom-safe-6');

         // Force Map Resize
         setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
            const mapEl = element.querySelector('#intro-map');
            if (mapEl && mapEl._leaflet_id) {
               // Iterate global L maps if needed? 
            }
         }, 100);
      };
   }

   if (closeFsBtn) {
      closeFsBtn.onclick = () => {
         // Exit Fullscreen
         mapWrapper.classList.remove('fixed', 'inset-0', 'z-[500]', 'bg-black');
         mapWrapper.classList.add('relative', 'flex-grow');

         closeFsBtn.classList.add('hidden');
         editBtn.classList.remove('hidden');

         // Restore Button Positions
         if (locateBtn) {
            locateBtn.classList.add('bottom-6');
            locateBtn.classList.remove('bottom-safe-6');
         }
         editBtn.classList.add('bottom-6');
         editBtn.classList.remove('bottom-safe-6');

         setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
         }, 100);
      };
   }

   // Info Modal Logic
   const infoBtn = element.querySelector('#intro-info-btn');
   if (infoBtn) {
      // ... existing info modal logic ...
      infoBtn.onclick = () => {
         const modal = document.createElement('dialog');
         modal.className = "m-0 p-0 absolute inset-0 z-[100] flex items-center justify-center bg-black/90 p-6 backdrop-blur-md w-full h-full max-w-full max-h-full bg-transparent";
         modal.setAttribute('aria-modal', 'true');
         modal.innerHTML = `
             <div class="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl overflow-y-auto max-h-[80vh]">
                 <h3 class="text-xl font-bold text-white mb-4">${t('intro.info_legal')}</h3>
                 
                 <div class="space-y-4 text-sm text-gray-300">
                     <p><strong>${t('intro.title_pre')} ${t('intro.title_post')}</strong> (v${APP_VERSION})</p>
                     
                     <!-- Disclaimer Moved Here -->
                     <div class="bg-red-900/20 border border-red-500/30 p-3 rounded-xl text-red-200 text-xs mb-4">
                         <strong>${t('legal.important_header')}</strong><br>
                         ${t('intro.disclaimer_text')}
                     </div>
                    
                    <div class="border-l-2 border-gray-600 pl-3 py-1">
                        <h4 class="font-bold text-white mb-1">${t('intro.info_impressum')}</h4>
                        <p class="text-xs text-gray-400 mb-1">${t('legal.tmg_header')}</p>
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
                         <p>Data <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 underline">© OpenStreetMap contributors</a>.</p>
                         <p>Code: MIT License</p>
                         
                         <p class="mt-3 text-xs font-bold text-gray-400">Map Tiles:</p>
                         <p class="text-[10px] text-gray-400 leading-tight">
                            Basemap: © OpenStreetMap contributors<br>
                            Satellite: Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community<br>
                            Topo: Map style: © OpenTopoMap (CC-BY-SA)
                         </p>

                         <a href="https://github.com/FrnkMrz/hydranten-app" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 underline mt-2 block">
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
         modal.showModal();
         modal.querySelector('#close-intro-info-btn').onclick = () => {
            modal.close();
            modal.remove();
            infoBtn.focus();
         };
      };
   }

   // Language Switcher Logic
   const langBtn = element.querySelector('#lang-btn');
   if (langBtn) {
      const flags = {
         'de': '🇩🇪', 'en': '🇬🇧', 'pl': '🇵🇱', 'cs': '🇨🇿',
         'fr': '🇫🇷', 'nl': '🇳🇱', 'es': '🇪🇸', 'pt': '🇵🇹',
         'hr': '🇭🇷', 'it': '🇮🇹', 'ja': '🇯🇵', 'ko': '🇰🇷', 'zh': '🇨🇳', 'tr': '🇹🇷', 'ar': '🇸🇦'
      };

      // Use innerHTML to ensure emojis render correctly on all devices
      const flagIcon = flags[lang] || '🌐';
      // Force system-ui / emoji fonts
      langBtn.innerHTML = `<span style="font-family: 'Apple Color Emoji','Segoe UI Emoji', system-ui; font-size: 1.5rem; line-height: 1;">${flagIcon}</span>`;

      langBtn.onclick = () => {
         const modal = document.createElement('dialog');
         modal.className = "m-0 p-0 absolute inset-0 z-[100] flex items-center justify-center bg-black/90 p-6 backdrop-blur-md w-full h-full max-w-full max-h-full bg-transparent";
         modal.setAttribute('aria-modal', 'true');

         const langs = [
            { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
            { code: 'en', label: 'English', flag: '🇬🇧' },
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
            { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
            { code: 'ar', label: 'العربية', flag: '🇸🇦' }
         ];

         modal.innerHTML = `
               <div class="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                   <h3 class="text-xl font-bold text-white mb-4 text-center">Language / Sprache</h3>
                   <div class="grid grid-cols-2 gap-3">
                       ${langs.map(l => `
                           <button class="lang-option p-3 min-h-[44px] rounded-xl bg-white/5 hover:bg-white/10 transition border border-white/10 flex items-center gap-3 ${lang === l.code ? 'border-green-500 bg-green-900/20' : ''}" data-code="${l.code}">
                               <span class="text-2xl">${l.flag}</span>
                               <span class="text-white font-bold text-sm">${l.label}</span>
                           </button>
                       `).join('')}
                   </div>
                   <button id="close-lang-btn" class="w-full mt-6 py-3 min-h-[44px] bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-xl font-bold transition">
                       Cancel
                   </button>
               </div>
           `;

         element.appendChild(modal);
         modal.showModal();

         modal.querySelectorAll('.lang-option').forEach(btn => {
            btn.onclick = () => {
               setLanguage(btn.dataset.code);
            };
         });

         modal.querySelector('#close-lang-btn').onclick = () => {
            modal.close();
            modal.remove();
            langBtn.focus();
         };
      };
   }

   // Reset cached markers on mount to force redraw on the new map instance
   if (visibleHydrants) visibleHydrants.clear();
   // Reset global layer reference if needed, though it's overwritten below
   hydrantLayer = null;
   // Live GPS Update & Map
   const mapContainer = element.querySelector('#intro-map');
   let map = null;
   //    let marker = null;

   // Init Cached Position immediately
   let lastPos = getLastKnownPosition();
   // Remove aggressive stale check - better to show old position than error
   //    const initialCenter = lastPos ? [lastPos.lat, lastPos.lng] : [48.137, 11.576];
   // Fix: Increase default zoom to 16 so that hydrate fetch (min 14) works even without GPS fix
   //    const initialZoom = lastPos ? 18 : 16;

   // Keep track of marker globally within this scope (closure) for updates
   let userMarker = null; // Re-introduced

   if (mapContainer && !map) {
      mapContainer.innerHTML = `<div class="flex flex-col h-full w-full items-center justify-center bg-gray-900 z-50 relative"><svg class="animate-spin h-10 w-10 text-blue-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span class="text-white font-medium text-lg">${t('messages.locating_position') || 'GPS wird gesucht...'}</span></div>`;

      // Toast Helper
      const showToast = (msg, isError = false) => {
         const toast = document.createElement('div');
         toast.className = `fixed bottom-24 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded shadow-lg z-[1000] text-sm font-medium transition-opacity duration-300 ${isError ? 'bg-red-600/90 text-white' : 'bg-gray-800/90 text-white'}`;
         toast.innerText = msg;
         document.body.appendChild(toast);
         // Fade in
         requestAnimationFrame(() => toast.style.opacity = '1');

         setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
         }, 4000);
      };

      const initMap = (centerLat, centerLng, zoomLevel) => {
         mapContainer.innerHTML = ''; // Clear loading

         const mapElement = element.querySelector('#intro-map');
         if (mapElement && !mapElement._leaflet_id) {
            map = L.map(mapElement, {
               zoomControl: false,
               attributionControl: false,
               dragging: true, // User requested dragging within 200m
               scrollWheelZoom: false,
               doubleClickZoom: false,
               touchZoom: false,
               boxZoom: false,
               keyboard: false,
               zoomSnap: 0,
            }).setView([centerLat, centerLng], zoomLevel);

            // Dynamic Tile Layer
            const style = localStorage.getItem('map_style') || 'osm';
            let tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
            let attribution = '&copy; OpenStreetMap contributors';
            let maxNativeZoom = 19; // Default OSM

            if (style === 'satellite') {
               tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
               attribution = 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';
            } else if (style === 'topo') {
               tileUrl = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
               attribution = 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)';
               maxNativeZoom = 16; // Topo reliable max zoom (scaled up to 19)
            }

            L.tileLayer(tileUrl, {
               maxZoom: style === 'topo' ? 17 : 19, // Limit Topo to 17 as requested
               maxNativeZoom: maxNativeZoom,
               attribution: attribution,
               opacity: style === 'osm' ? 0.8 : 1.0
            }).addTo(map);

            // Initial Hydrant Layer
            hydrantLayer = L.layerGroup().addTo(map);

            // Check 'permissions' API to auto-start ONLY if already granted (avoids violation warning)
            if (navigator.permissions && navigator.permissions.query) {
               navigator.permissions.query({ name: 'geolocation' }).then(res => {
                  if (res.state === 'granted') {
                     startMapGps(map, (lat, lng) => {
                        if (!userMarker) {
                           userMarker = L.marker([lat, lng], { interactive: false }).addTo(map);
                        } else {
                           userMarker.setLatLng([lat, lng]);
                        }
                     }, onEdit);
                  }
               }).catch(() => { });
            }

            // Debounced Map Move Handler
            // Pass onEdit here!
            const debouncedUpdate = debounce(() => updateHydrants(map, onEdit), 1000);

            // Let's just hook into moveend if the map MOVES (even programmatically).
            map.on('moveend', debouncedUpdate);

            // Force a resize invalidation shortly after render to ensure map fills container
            setTimeout(() => {
               map.invalidateSize();

               // Apply constraints if we have a specific position (zoom 18)
               if (zoomLevel >= 18) {
                  const BOUND_OFFSET = 0.002;
                  map.setMaxBounds([
                     [centerLat - BOUND_OFFSET, centerLng - BOUND_OFFSET],
                     [centerLat + BOUND_OFFSET, centerLng + BOUND_OFFSET]
                  ]);
                  if (!userMarker) userMarker = L.marker([centerLat, centerLng], { interactive: false }).addTo(map);
                  else userMarker.setLatLng([centerLat, centerLng]);
               }

               updateHydrants(map, onEdit);
            }, 300);
         }
      }; // End initMap function

      let hasUserDragged = false;

      const fetchGpsAndUpdate = (forceCenter = false, showBtnSpinner = false) => {
         const locateBtnLoader = showBtnSpinner ? element.querySelector('#locate-me-btn svg') : null;
         if (locateBtnLoader) locateBtnLoader.classList.add('animate-spin');

         return getPosition(true)
            .then(pos => {
               // Initial map load check
               if (!map) {
                  initMap(pos.lat, pos.lng, 18);
                  // Setup drag listening after map is ready
                  map.on('dragstart', () => { hasUserDragged = true; });
               } else {
                  if (userMarker) userMarker.setLatLng([pos.lat, pos.lng]);

                  if (!hasUserDragged || forceCenter) {
                     map.setView([pos.lat, pos.lng], 18);
                     hasUserDragged = false; // reset flag on force

                     // Re-apply bounds around the fresh location
                     const BOUND_OFFSET = 0.002;
                     map.setMaxBounds([
                        [pos.lat - BOUND_OFFSET, pos.lng - BOUND_OFFSET],
                        [pos.lat + BOUND_OFFSET, pos.lng + BOUND_OFFSET]
                     ]);
                  }
               }
               updatePosition({ coords: { latitude: pos.lat, longitude: pos.lng, accuracy: pos.accuracy, heading: pos.heading } });
            })
            .catch(err => {
               console.warn("GPS update failed", err);
               if (!map) {
                  showToast(t('error.gps_unavailable'), true);
                  // Fallback: Default Germany Center or lastPos
                  if (lastPos) {
                     initMap(lastPos.lat, lastPos.lng, 18);
                  } else {
                     initMap(51.1657, 10.4515, 6);
                  }
                  if (map) map.on('dragstart', () => { hasUserDragged = true; });
               }
            })
            .finally(() => {
               if (locateBtnLoader) locateBtnLoader.classList.remove('animate-spin');
            });
      };

      // Locate Me Button Setup
      const locateBtn = element.querySelector('#locate-me-btn');
      if (locateBtn) {
         locateBtn.onclick = () => {
            hasUserDragged = false; // Reset drag so it forces centration
            fetchGpsAndUpdate(true, true);
         };
      }

      // EXECUTE: Start fetch loop initially
      fetchGpsAndUpdate(true);

      // Start polling every 15 seconds
      element._gpsPollInterval = setInterval(() => fetchGpsAndUpdate(false, false), 15000);
   }

   // Return Cleanup Function
   return () => {
      if (element && element._gpsPollInterval) {
         clearInterval(element._gpsPollInterval);
      }
   };
}

// Extracted GPS start logic
function startMapGps(map, onLocationFound, _onEdit) {
   if (!navigator.geolocation) return;

   // BOUND_OFFSET ~ 200m
   const BOUND_OFFSET = 0.002;

   // Single fetch for center
   navigator.geolocation.getCurrentPosition(pos => {
      const { latitude, longitude } = pos.coords;
      map.setView([latitude, longitude], 18);

      // RESTRICT DRAGGING (New) - Ensure it applies after view is set
      setTimeout(() => {
         map.setMaxBounds([
            [latitude - BOUND_OFFSET, longitude - BOUND_OFFSET],
            [latitude + BOUND_OFFSET, longitude + BOUND_OFFSET]
         ]);
      }, 100);

      // We don't call updateHydrants here because moveend will trigger it?
      // updateHydrants(map, onEdit); // Triggered by setView -> moveend
      // Actually, if we setMaxBounds, it might constrain view.

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

   // Fetch padded bounds to ensure we cover the draggable area
   const bounds = map.getBounds().pad(0.5);

   overpass.fetchHydrants(bounds)
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
         } catch (_e) { /* ignore */ }

         // 1. Filter out deleted
         let filteredElements = elements.filter(node => !localDeleted.includes(String(node.id)));

         // 2. Inject local/newly created hydrants (if not already present)
         const existingIds = new Set(filteredElements.map(n => String(n.id)));
         // let injectedCount = 0;

         localCreated.forEach(localNode => {
            // Check bounds (roughly) to only add if in view? 
            // Or just add them, Leaflet handles off-screen fine usually, but Overpass query was bounded.
            // Let's checks bounds to be nice.
            if (map.getBounds().contains([localNode.lat, localNode.lon])) {
               // Fix: Ensure we don't re-inject if it was deleted locally!
               if (!localDeleted.includes(String(localNode.id))) {
                  if (!existingIds.has(String(localNode.id))) {
                     filteredElements.push(localNode);
                     // injectedCount++;
                  }
               }
            }
         });

         // Logic for Edit Button Visibility
         const totalHydrants = filteredElements.length;
         if (totalHydrants > 0) {
            const editBtn = document.querySelector('#edit-mode-btn');
            const closeFsBtn = document.querySelector('#close-fullscreen-btn');
            const isFullscreen = closeFsBtn && !closeFsBtn.classList.contains('hidden');

            if (editBtn && !isFullscreen) editBtn.classList.remove('hidden');
         }

         // console.log(`Fetched ${elements.length}, Deleted ${elements.length - filteredElements.length + injectedCount}, Injected ${injectedCount} locals. Showing ${filteredElements.length}`);

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

               // Screen Reader Accessible Marker
               const iconHtml = `<div role="button" tabindex="0" aria-label="${t('intro.hydrant_marker_alt') || 'Hydrant anzeigen und bearbeiten'}" class="w-full h-full rounded-full border-2 border-white shadow-md focus:outline-none focus:ring-4 focus:ring-blue-500 transition-all cursor-pointer" style="background-color: ${fillColor}; opacity: 0.9;"></div>`;

               const m = L.marker([node.lat, node.lon], {
                  icon: L.divIcon({
                     className: 'hydrant-custom-icon bg-transparent',
                     html: iconHtml,
                     iconSize: [24, 24], // 24x24 minimum swipable touch area
                     iconAnchor: [12, 12]
                  }),
                  keyboard: true
               });

               // Fix: Ensure marker is added to layer!
               m.addTo(hydrantLayer);

               // Since it's a native button inside the icon, we can just use the standard Leaflet click
               // which also fires when VoiceOver "double taps" the element
               m.on('click', () => {
                  // console.log("Clicked Hydrant:", node.id, "onEdit:", onEdit); // DEBUG
                  // Visual feedback
                  const btn = m.getElement().querySelector('[role="button"]');
                  if (btn) {
                     btn.style.backgroundColor = '#3b82f6';
                     btn.style.transform = 'scale(1.2)';
                     btn.style.borderWidth = '4px';
                  }

                  setTimeout(() => {
                     if (onEdit) {
                        onEdit(node.id); // Trigger Edit Mode
                     } else {
                        console.error("onEdit is MISSING in click handler!");
                        import('../components/overlay.js').then(({ showMessageOverlay }) => {
                           const app = document.getElementById('app');
                           showMessageOverlay(app, "Error", t('error.edit_function_missing'), 'error');
                        });
                     }
                  }, 100);
               });

               m.addTo(hydrantLayer);
            }
         });
      })
      .catch(err => {
         console.warn("Hydranten konnten nicht geladen werden:", err);
         // Show Toast
         const mapContainer = document.querySelector('#intro-map');
         if (mapContainer && mapContainer.parentNode) {
            const toast = document.createElement('div');
            toast.className = "absolute top-4 left-1/2 -translate-x-1/2 bg-red-600/90 backdrop-blur text-white px-4 py-2 rounded-full shadow-lg text-xs font-bold z-50 animate-fade-in pointer-events-none";
            toast.innerText = t("error.network_error");
            mapContainer.parentNode.appendChild(toast);
            setTimeout(() => {
               toast.classList.add('opacity-0', 'transition-opacity', 'duration-500');
               setTimeout(() => toast.remove(), 500);
            }, 3000);
         }
      });
}
