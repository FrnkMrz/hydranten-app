import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
// Fix for Leaflet default icon issues in Vite/Webpack
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { getLastKnownPosition, updatePosition, getPosition, initCompass, startTracking, hasCompassAccess } from '../services/geo.js';
import { createHydrantLoadStatus } from './hydrant-load-status.js';
import { renderAedMarkerSymbol } from './aed-marker.js';

import { overpass } from '../services/overpass.js';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
   iconRetinaUrl: markerIcon2x,
   iconUrl: markerIcon,
   shadowUrl: markerShadow,
});

// Globals for Hydrants
const visibleHydrants = new Set();
const hydrantMarkerData = new Map();
let hydrantLayer = null;

import { t, lang, setLanguage } from '../services/i18n.js';
import { escapeHTML } from '../utils/security.js';
import { APP_VERSION } from '../version.js';

export function renderIntroView() {
   // Check Login Status
   let loginText = t('intro.login_osm');
   let loginClass = "";

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
            loginText = `<img src="${escapeHTML(img)}" class="w-7 h-7 shrink-0 rounded-full ring-2 ring-emerald-400/70 object-cover" alt=""> <span class="truncate">${name}</span>`;
         } else {
            loginText = `<span class="truncate">${name}</span>`;
         }

         loginClass = "text-emerald-300";
      }
   } catch (_e) { /* ignore */ }

   // Line icons for the four steps (stroke uses the tile's ember colour).
   const stepIcon = path => `<span class="hj-step-icon" aria-hidden="true"><svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">${path}</svg></span>`;
   const steps = [
      { key: 'step1', icon: '<path d="M3 17 17 3l4 4L7 21z"/><path d="m7 13 2 2M10 10l2 2M13 7l2 2"/>' },
      { key: 'step2', icon: '<path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/>' },
      { key: 'step3', icon: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>' },
      { key: 'step4', icon: '<path d="M7 18a4 4 0 0 1-.6-7.95A5.5 5.5 0 0 1 17.2 9.1 4.5 4.5 0 0 1 17 18"/><path d="M12 19v-7m0 0-3 3m3-3 3 3"/>' }
   ];
   const stepsHtml = steps.map(({ key, icon }, index) => {
      const bold = t(`intro.${key}_bold`);
      const rest = t(`intro.${key}`).replace(bold, '').trim();
      return `
             <li class="relative flex min-w-0 flex-col items-center gap-2 text-center">
                ${index > 0 ? '<span class="absolute top-[1.35rem] right-[calc(50%+1.6rem)] h-px w-[calc(100%-3.2rem)] bg-gradient-to-r from-white/5 to-white/20" aria-hidden="true"></span>' : ''}
                ${stepIcon(icon)}
                <p class="min-w-0 max-w-full leading-tight">
                   <span class="block text-[13px] font-bold text-white break-words">${bold}</span>
                   <span class="block text-[11px] text-white/50 break-words">${rest}</span>
                </p>
             </li>`;
   }).join('');

   return `
    <div class="h-full w-full bg-ink-900 text-white flex flex-col relative overflow-hidden">
      
      <!-- Map - Fills remaining space (flex-1) -->
      <div class="w-full flex-1 min-h-[34%] relative z-0">
          <div id="intro-map" class="absolute inset-0 z-0"></div>
          <div id="hydrant-data-status" class="hidden" role="status" aria-live="polite" aria-atomic="true"></div>
          <div id="map-data-source" class="hj-pill hidden pointer-events-none absolute top-safe-14 left-1/2 z-[401] -translate-x-1/2 px-3 py-1.5 text-[10px] font-semibold tracking-wide text-white/80" role="status" aria-live="polite"></div>
          
          <!-- LOCATE ME BUTTON -->
          <button id="locate-me-btn" class="hj-fab hj-fab-aqua absolute bottom-10 right-4 z-[401]" aria-label="Locate Me">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          </button>

          <!-- EDIT BUTTON (Initial Hidden) -->
          <button id="edit-mode-btn" class="hj-fab hidden absolute bottom-10 left-4 z-[401]" aria-label="Edit Mode">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
          </button>

          <!-- CLOSE FULLSCREEN BUTTON (Hidden) -->
          <button id="close-fullscreen-btn" class="hj-fab hidden absolute top-safe-4 left-4 z-[402]" aria-label="Close Map">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>

          <!-- Vignettes: soften the map into the status bar and the sheet -->
          <div class="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-ink-950/55 to-transparent pointer-events-none z-[400]"></div>
          <div class="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-ink-950/70 to-transparent pointer-events-none z-[400]"></div>
      </div>

      <!-- Bottom Sheet Content - Auto Height, Stacked -->
      <div class="hj-sheet w-full shrink-0 z-10 flex flex-col items-center px-5 pb-safe pt-3 -mt-7 relative">
         
         <!-- Drag Handle / Visual Indicator -->
         <div class="hj-grabber mb-5"></div>

         <!-- Hero Title -->
         <div class="text-center mb-5 w-full">
             <h1 class="hj-wordmark text-[2.5rem] text-white">
                Hydranten <span class="hj-ember-text">Jäger</span>
             </h1>
             ${lang !== 'de' ? `<p class="hj-eyebrow mt-2">${t('intro.title_pre')} ${t('intro.title_post')}</p>` : ''}
         </div>

         <!-- Steps -->
         <ol class="hj-card w-full max-w-md grid grid-cols-4 gap-1 px-2 py-4 mb-5 list-none">
             ${stepsHtml}
         </ol>

         <!-- Start Button -->
         <button id="start-btn" class="hj-btn hj-btn-primary w-full max-w-md min-h-[4rem] text-lg tracking-[0.12em] mb-4">
             <svg aria-hidden="true" class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/></svg>
             <span>${t('intro.start_btn')}</span>
         </button>
          
         <!-- Footer Actions -->
         <div class="flex items-center gap-2 w-full max-w-md">
              <button id="lang-btn" class="hj-btn hj-btn-ghost w-14 shrink-0 px-0 min-h-[3rem]" aria-label="${t('intro.lang_btn_aria') || 'Language / Sprache'}">
                🇩🇪
              </button>

              <button id="intro-settings-btn" class="hj-btn hj-btn-ghost flex-grow min-w-0 min-h-[3rem] text-sm ${loginClass}">
                 ${!loginText.includes('<img') ? `<svg aria-hidden="true" class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>` : ''}
                 ${loginText}
              </button>
              <button id="intro-info-btn" class="hj-btn hj-btn-ghost w-14 shrink-0 px-0 min-h-[3rem]" aria-label="Information & Legal">
                <svg aria-hidden="true" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 7.5v.01"/></svg>
              </button>
         </div>
          
         <div class="mt-3 mb-2 text-center">
             <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" class="text-[10px] text-white/30 hover:text-white/60 transition no-underline block">
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
               updatePosition({ coords: { latitude: pos.lat, longitude: pos.lng, accuracy: pos.accuracy, heading: pos.heading }, timestamp: pos.timestamp, timestampIsDevice: pos.timestampIsDevice });
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
            locateBtn.classList.remove('bottom-10');
            locateBtn.classList.add('bottom-safe-6');
         }
         // editBtn is hidden, so no need to adjust its bottom, but good practice if resurrected
         editBtn.classList.remove('bottom-10');
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
            locateBtn.classList.add('bottom-10');
            locateBtn.classList.remove('bottom-safe-6');
         }
         editBtn.classList.add('bottom-10');
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
         modal.className = "hj-backdrop m-0 absolute inset-0 z-[100] flex items-center justify-center p-5 w-full h-full max-w-full max-h-full";
         modal.setAttribute('aria-modal', 'true');
         modal.innerHTML = `
             <div class="hj-dialog custom-scrollbar p-6 max-w-sm w-full overflow-y-auto max-h-[80vh]">
                 <h3 class="text-xl font-extrabold tracking-tight text-white mb-4">${t('intro.info_legal')}</h3>
                 
                 <div class="space-y-4 text-sm text-gray-300">
                     <p><strong>${t('intro.title_pre')} ${t('intro.title_post')}</strong> (v${APP_VERSION})</p>
                     
                     <!-- Disclaimer Moved Here -->
                     <div class="rounded-2xl border border-ember-500/30 bg-ember-500/10 p-3 text-xs text-ember-300 mb-4">
                         <strong>${t('legal.important_header')}</strong><br>
                         ${t('intro.disclaimer_text')}
                     </div>
                    
                    <div class="border-l-2 border-white/15 pl-3 py-1">
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

                 <button id="close-intro-info-btn" class="hj-btn hj-btn-primary w-full mt-6">
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
         modal.className = "hj-backdrop m-0 absolute inset-0 z-[100] flex items-center justify-center p-5 w-full h-full max-w-full max-h-full";
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
               <div class="hj-dialog custom-scrollbar p-6 max-w-sm w-full max-h-[86vh] overflow-y-auto">
                   <h3 class="text-xl font-extrabold tracking-tight text-white mb-4 text-center">Language / Sprache</h3>
                   <div class="grid grid-cols-2 gap-3">
                       ${langs.map(l => `
                           <button class="lang-option hj-option p-3 min-h-[44px] flex items-center gap-3 ${lang === l.code ? 'is-selected' : ''}" data-code="${l.code}">
                               <span class="text-2xl">${l.flag}</span>
                               <span class="text-white font-bold text-sm">${l.label}</span>
                           </button>
                       `).join('')}
                   </div>
                   <button id="close-lang-btn" class="hj-btn hj-btn-ghost w-full mt-6">
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
   hydrantMarkerData.clear();
   // Reset global layer reference if needed, though it's overwritten below
   hydrantLayer = null;
   // Live GPS Update & Map
   const mapContainer = element.querySelector('#intro-map');
   let map = null;
   //    let marker = null;
   const hydrantRequestState = {
      latestRequestId: 0,
      controller: null
   };
   const hydrantLoadStatus = createHydrantLoadStatus(
      element.querySelector('#hydrant-data-status'),
      () => {
         if (map) {
            updateHydrants(map, onEdit, hydrantLoadStatus, hydrantRequestState, { immediate: true });
         }
      }
   );

   // Init Cached Position immediately
   let lastPos = getLastKnownPosition();
   // Remove aggressive stale check - better to show old position than error
   //    const initialCenter = lastPos ? [lastPos.lat, lastPos.lng] : [48.137, 11.576];
   // Fix: Increase default zoom to 16 so that hydrate fetch (min 14) works even without GPS fix
   //    const initialZoom = lastPos ? 18 : 16;

   // Keep track of marker globally within this scope (closure) for updates
   let userMarker = null; // Re-introduced

   if (mapContainer && !map) {
      mapContainer.innerHTML = `<div class="hj-screen flex flex-col h-full w-full items-center justify-center z-50 relative"><svg class="animate-spin h-10 w-10 text-ember-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span class="text-white/80 font-semibold">${t('messages.locating_position') || 'GPS wird gesucht...'}</span></div>`;

      // Toast Helper
      const showToast = (msg, isError = false) => {
         const toast = document.createElement('div');
         toast.className = `hj-toast fixed top-safe-4 left-1/2 -translate-x-1/2 z-[1000] ${isError ? 'hj-toast-error' : ''}`;
         toast.setAttribute('role', isError ? 'alert' : 'status');
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
            let tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
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
            const debouncedUpdate = debounce(
               () => updateHydrants(map, onEdit, hydrantLoadStatus, hydrantRequestState),
               1000
            );

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

               updateHydrants(map, onEdit, hydrantLoadStatus, hydrantRequestState);
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
               updatePosition({ coords: { latitude: pos.lat, longitude: pos.lng, accuracy: pos.accuracy, heading: pos.heading }, timestamp: pos.timestamp, timestampIsDevice: pos.timestampIsDevice });
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
      hydrantRequestState.latestRequestId++;
      hydrantRequestState.controller?.abort();
      hydrantLoadStatus.destroy();
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
function updateHydrants(map, onEdit, loadStatus, requestState, { immediate = false } = {}) {
   if (map.getZoom() < 14) {
      requestState.latestRequestId++;
      requestState.controller?.abort();
      requestState.controller = null;
      loadStatus.hide();
      return; // Don't fetch for whole world
   }

   // Fetch padded bounds to ensure we cover the draggable area
   const bounds = map.getBounds().pad(0.5);
   requestState.controller?.abort();

   const controller = new AbortController();
   const requestId = ++requestState.latestRequestId;
   requestState.controller = controller;
   loadStatus.setLoading({ immediate });

   const renderHydrants = (elements, { preview = false } = {}) => {
      if (requestId !== requestState.latestRequestId) return;
      if (!hydrantLayer) return;

      const sourceStatus = document.getElementById('map-data-source');
      if (sourceStatus) {
         const source = elements.dataSource;
         if (source?.type === 'regional') {
            const dataTimestamp = source.osmDataUntil;
            const parsedDate = dataTimestamp ? new Date(dataTimestamp) : null;
            const date = parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.toLocaleDateString(lang) : '–';
            sourceStatus.textContent = t('hydrant_data.source_regional').replace('{date}', date);
            sourceStatus.title = source.liveDelta == null
               ? sourceStatus.textContent
               : source.liveDelta === false
                  ? t('hydrant_data.source_regional_no_delta')
                  : t('hydrant_data.source_regional_live_delta');
         } else {
            sourceStatus.textContent = t('hydrant_data.source_overpass');
            sourceStatus.title = t('hydrant_data.source_overpass');
         }
         sourceStatus.classList.remove('hidden');
      }

      // Optimistic Filter: Remove hydrants that we know are deleted locally
      let localDeleted = [];
      let localCreated = [];
      let localUpdated = [];
      try {
         // Stored caches may be corrupt or written by an older version: accept
         // only arrays of usable entries so one bad value cannot break the map.
         const readList = key => {
            const value = JSON.parse(localStorage.getItem(key) || '[]');
            return Array.isArray(value) ? value : [];
         };
         const isNode = n => n && typeof n === 'object' && n.id !== null && n.id !== undefined &&
            Number.isFinite(n.lat) && Number.isFinite(n.lon);
         localDeleted = readList('deleted_hydrants').map(String);
         localCreated = readList('created_hydrants').filter(isNode);
         localUpdated = readList('updated_hydrants').filter(isNode);

         // Cleanup Created: Remove items older than 15 minutes or arguably if they appear in API (handled below)
         const now = Date.now();
         const validCreated = localCreated.filter(n => (now - (n.timestamp || 0)) < 15 * 60 * 1000);
         if (validCreated.length !== localCreated.length) {
            localStorage.setItem('created_hydrants', JSON.stringify(validCreated));
            localCreated = validCreated;
         }

         const validUpdated = localUpdated.filter(node => (now - (node.timestamp || 0)) < 30 * 24 * 60 * 60 * 1000);
         if (validUpdated.length !== localUpdated.length) {
            localStorage.setItem('updated_hydrants', JSON.stringify(validUpdated));
            localUpdated = validUpdated;
         }
      } catch (_e) { /* ignore */ }

      // 1. Filter out deleted
      let filteredElements = elements.filter(node => !localDeleted.includes(String(node.id)));

      // 2. Apply local edits until a later data response contains the saved version.
      const stillPendingUpdates = [];
      localUpdated.forEach(localNode => {
         const nodeIndex = filteredElements.findIndex(node => String(node.id) === String(localNode.id));
         const serverNode = nodeIndex >= 0 ? filteredElements[nodeIndex] : null;
         const updateIsVisible = map.getBounds().contains([localNode.lat, localNode.lon]);
         const localTags = localNode.tags || {};
         const serverTags = serverNode?.tags || {};
         const localVersion = Number(localNode.version);
         const serverVersion = Number(serverNode?.version);
         const serverHasNewerVersion = serverNode && !serverNode._isPendingLocalEdit &&
            Number.isSafeInteger(localVersion) && localVersion > 0 &&
            Number.isSafeInteger(serverVersion) && serverVersion > localVersion;
         if (serverHasNewerVersion) return;
         const tagsMatch = Object.keys(localTags).length === Object.keys(serverTags).length &&
            Object.entries(localTags).every(([key, value]) => serverTags[key] === value);
         // The area cache is patched optimistically after a successful edit. It cannot confirm
         // that the upstream Overpass/PMTiles data has caught up with the saved edit.
         if (serverNode && !serverNode._isPendingLocalEdit && Math.abs(serverNode.lat - localNode.lat) < 1e-7 &&
             Math.abs(serverNode.lon - localNode.lon) < 1e-7 &&
             tagsMatch) {
            return;
         }
         stillPendingUpdates.push(localNode);
         if (nodeIndex >= 0) filteredElements.splice(nodeIndex, 1);
         if (updateIsVisible && !localDeleted.includes(String(localNode.id))) {
            filteredElements.push({ ...localNode, type: 'node', tags: { ...localNode.tags } });
         }
      });
      if (!preview && stillPendingUpdates.length !== localUpdated.length) {
         try { localStorage.setItem('updated_hydrants', JSON.stringify(stillPendingUpdates)); } catch (_e) { /* ignore */ }
      }

      // 3. Inject local/newly created hydrants (if not already present)
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

         const markerKey = String(node.id);
         const markerSignature = `${node.lat},${node.lon},${JSON.stringify(node.tags || {})}`;
         const previousMarker = hydrantMarkerData.get(markerKey);
         if (previousMarker && previousMarker.signature !== markerSignature) {
            previousMarker.marker.remove();
            hydrantMarkerData.delete(markerKey);
            visibleHydrants.delete(markerKey);
         }

         if (!visibleHydrants.has(markerKey)) {
            visibleHydrants.add(markerKey);

            // Determine color based on tags
            let fillColor = RED;
            const isAed = node.tags?.emergency === 'defibrillator';
            const isSuction = node.tags && (
               node.tags.emergency === 'suction_point' ||
               node.tags.emergency === 'water_tank' ||
               node.tags['fire_hydrant:type'] === 'suction_point' ||
               node.tags['fire_hydrant:type'] === 'cistern'
            );

            if (isSuction) {
               fillColor = BLUE;
            } else if (isAed) {
               fillColor = '#16A34A';
            }

            const markerLabel = isAed ? t('confirm.aed_marker_aria') : t('confirm.title_edit');
            const markerVisualClass = isAed
               ? 'hydrant-marker-visual aed-marker-visual w-full h-full rounded-md border-2 border-white shadow-md transition-all cursor-pointer overflow-hidden'
               : 'hydrant-marker-visual w-full h-full rounded-full border-2 border-white shadow-md transition-all cursor-pointer flex items-center justify-center text-white';
            const markerSymbol = isAed ? renderAedMarkerSymbol() : '';
            const iconHtml = `<div aria-hidden="true" class="${markerVisualClass}" style="${isAed ? '' : `background-color: ${fillColor}; `}opacity: 0.95;">${markerSymbol}</div>`;

            const m = L.marker([node.lat, node.lon], {
               icon: L.divIcon({
                  className: 'hydrant-custom-icon bg-transparent',
                  html: iconHtml,
                  iconSize: isAed ? [32, 32] : [24, 24], // Minimum swipable touch area
                  iconAnchor: isAed ? [16, 16] : [12, 12]
               }),
               keyboard: true
            });

            m.addTo(hydrantLayer);
            hydrantMarkerData.set(markerKey, { marker: m, signature: markerSignature });
            const markerElement = m.getElement();
            if (markerElement) {
               markerElement.setAttribute('role', 'button');
               markerElement.setAttribute('aria-label', markerLabel);
            }

            m.on('click', () => {
               // console.log("Clicked Hydrant:", node.id, "onEdit:", onEdit); // DEBUG
               // Visual feedback
               const btn = m.getElement()?.querySelector('.hydrant-marker-visual');
               if (btn) {
                  btn.style.backgroundColor = '#1fa8d8';
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

         }
      });

      loadStatus.setSuccess();
   };

   overpass.fetchHydrants(bounds, {
      signal: controller.signal,
      zoom: map.getZoom(),
      onRegionalData: elements => renderHydrants(elements, { preview: true })
   })
      .then(elements => renderHydrants(elements))
      .catch(err => {
         if (requestId !== requestState.latestRequestId || err.name === 'AbortError') return;

         console.warn("Hydranten konnten nicht geladen werden:", err);
         loadStatus.setError({ hasCachedData: visibleHydrants.size > 0 });
      })
      .finally(() => {
         if (requestId === requestState.latestRequestId) {
            requestState.controller = null;
         }
      });
}
