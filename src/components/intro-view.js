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

export function renderIntroView() {
   // Check Login Status
   let loginText = "OSM Login";
   let loginClass = "text-gray-400 hover:text-white";

   try {
      const token = JSON.parse(localStorage.getItem('osm-auth') || '{}');
      if (token.access_token) {
         const name = localStorage.getItem('osm_user_name') || "Angemeldet";
         loginText = `✅ ${name}`;
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
         
         <!-- Hero Title (Immediately below map with some spacing) -->
         <div class="text-center mt-6 mb-8">
             <h1 class="text-4xl font-extrabold text-white mb-2 tracking-tight drop-shadow-xl">
                Hydranten <span class="text-red-500">Jäger</span>
             </h1>
         </div>

         <!-- Instructions Card -->
         <div class="w-full bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 space-y-3 text-sm text-gray-300 shadow-xl">
             <div class="flex items-center gap-4">
                <span class="text-xl bg-white/10 p-2 rounded-lg">📏</span> <p><span class="text-white font-bold">3 Meter</span> Abstand</p>
             </div>
             <div class="flex items-center gap-4">
                <span class="text-xl bg-white/10 p-2 rounded-lg">📸</span> <p><span class="text-white font-bold">Foto</span> machen</p>
             </div>
             <div class="flex items-center gap-4">
                <span class="text-xl bg-white/10 p-2 rounded-lg">✏️</span> <p><span class="text-white font-bold">Daten</span> ergänzen</p>
             </div>
             <div class="flex items-center gap-4">
                <span class="text-xl bg-white/10 p-2 rounded-lg">☁️</span> <p><span class="text-white font-bold">Hochladen</span> zu OSM</p>
             </div>
         </div>
      </div>

      <!-- Footer Action -->
      <div class="h-auto shrink-0 z-10 w-full max-w-sm mx-auto flex flex-col justify-end px-6 pb-24">
          <button id="start-btn" class="w-full py-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white rounded-2xl font-bold text-lg shadow-xl shadow-red-900/30 active:scale-95 transition-all flex items-center justify-center gap-2 mb-4">
             STARTEN
          </button>
          
          <div class="flex items-center gap-3">
              <button id="intro-settings-btn" class="flex-grow py-3 flex items-center justify-center gap-2 ${loginClass} transition-colors text-sm font-medium hover:bg-white/5 rounded-xl">
                 <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                 ${loginText}
              </button>
              <button id="intro-info-btn" class="w-10 h-10 shrink-0 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition flex items-center justify-center border border-white/10">
                <span class="font-serif italic font-bold text-lg">i</span>
              </button>
          </div>
         
   
    </div>
   `;
}

export function initIntroView(element, onStart, onSettings) {
   const btn = element.querySelector('#start-btn');
   if (btn) {
      btn.onclick = () => {
         // iOS 13+ Compass Permission
         if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission()
               .then(response => {
                  if (response === 'granted') {
                     console.log("Compass Permission Granted");
                  } else {
                     console.warn("Compass Permission Denied");
                  }
               })
               .catch(console.error)
               .finally(() => onStart());
         } else {
            onStart();
         }
      };
   }

   const settingsBtn = element.querySelector('#intro-settings-btn');
   if (settingsBtn && onSettings) {
      settingsBtn.onclick = onSettings;
   }

   // Info Modal Logic (Intro)
   const infoBtn = element.querySelector('#intro-info-btn');
   if (infoBtn) {
      infoBtn.onclick = () => {
         const modal = document.createElement('div');
         modal.className = "absolute inset-0 z-50 flex items-center justify-center bg-black/90 p-6 animate-fade-in backdrop-blur-md";
         modal.innerHTML = `
             <div class="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl overflow-y-auto max-h-[80vh]">
                 <h3 class="text-xl font-bold text-white mb-4">Rechtliche Hinweise</h3>
                 
                 <div class="space-y-4 text-sm text-gray-300">
                    <p><strong>Hydranten Jäger</strong> ist ein Open Source Tool zur Erfassung von Hydranten in OpenStreetMap.</p>
                    
                    <div class="border-l-2 border-gray-600 pl-3 py-1">
                        <h4 class="font-bold text-white mb-1">Impressum</h4>
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
                         <h4 class="font-bold text-white">Daten & Datenschutz</h4>
                         <p>Diese App speichert keine personenbezogenen Daten auf eigenen Servern. Alle Eingaben werden direkt an OpenStreetMap (OSM) übermittelt.</p>
                     </div>

                     <div>
                         <h4 class="font-bold text-white">Lizenz & Code</h4>
                         <p>Kartendaten © OpenStreetMap Mitwirkende.</p>
                         <p>Code: MIT License</p>
                         <a href="https://github.com/FrnkMrz/hydranten-app" target="_blank" class="text-blue-400 hover:text-blue-300 underline mt-1 block">
                             📂 Projekt auf GitHub ansehen
                         </a>
                     </div>
                 </div>

                 <button id="close-intro-info-btn" class="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition">
                     Verstanden
                 </button>
             </div>
           `;
         element.appendChild(modal);
         modal.querySelector('#close-intro-info-btn').onclick = () => modal.remove();
      };
   }

   // Live GPS Update & Map
   const mapContainer = element.querySelector('#intro-map');
   let map = null;
   let marker = null;

   // Init Cached Position immediately
   const lastPos = getLastKnownPosition();
   const initialCenter = lastPos ? [lastPos.lat, lastPos.lng] : [48.137, 11.576];
   const initialZoom = lastPos ? 18 : 13;

   if (mapContainer && !map) {
      // Initialize Map
      const mapElement = element.querySelector('#intro-map');
      if (mapElement && !mapElement._leaflet_id) {
         map = L.map(mapElement, {
            zoomControl: false,
            attributionControl: false,
            dragging: false,
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
         if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(pos => {
               const { latitude, longitude } = pos.coords;
               map.setView([latitude, longitude], 18); // Force Zoom 18
               updateHydrants(map); // Initial fetch
            }, err => {
               console.log("Intro GPS error", err);
            }, { enableHighAccuracy: true });
         }

         // If we want it to update live when user moves (walking):
         // The main.js might handle GPS, but intro-view initializes its own map.
         // Let's just hook into moveend if the map MOVES (even programmatically).
         map.on('moveend', () => {
            updateHydrants(map);
         });
      }

      // Force a resize invalidation shortly after render to ensure map fills container
      setTimeout(() => {
         map.invalidateSize();
         if (lastPos) map.setView([lastPos.lat, lastPos.lng], 18);
      }, 100);
   }

   if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
         (pos) => {
            // Feed global cache!
            updatePosition(pos);

            // Update Map stuff
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;

            if (map) {
               // Only re-center if we moved significantly (> 3 meters) 
               // OR if this is the first fix (marker might be off)
               const currentCenter = map.getCenter();
               const dist = map.distance(currentCenter, [lat, lng]);

               if (dist > 3 || !marker) {
                  map.setView([lat, lng], 18, { animate: true });
               }

               if (!marker) {
                  marker = L.marker([lat, lng]).addTo(map);
               } else {
                  marker.setLatLng([lat, lng]);
               }
            }
         },
         (err) => {
            console.warn("Intro GPS Error", err);
         },
         { enableHighAccuracy: true, maximumAge: 5000 }
      );
      // Return Cleanup Function
      return () => {
         if (navigator.geolocation && typeof watchId !== 'undefined') {
            navigator.geolocation.clearWatch(watchId);
            console.log("Intro View: Watcher Cleared");
         }
      };
   }
}

// Helper to fetch and draw
function updateHydrants(map) {
   if (map.getZoom() < 14) return; // Don't fetch for whole world

   overpass.fetchHydrants(map.getBounds()).then(elements => {
      if (!hydrantLayer) return;

      // Jäger Red (Tailwind red-600) = #DC2626
      const RED = '#DC2626';

      elements.forEach(node => {
         if (!visibleHydrants.has(node.id)) {
            visibleHydrants.add(node.id);

            L.circleMarker([node.lat, node.lon], {
               radius: 5,
               fillColor: RED,
               color: '#fff',
               weight: 1,
               opacity: 0.8,
               fillOpacity: 0.9,
               className: 'hydrant-marker'
            }).addTo(hydrantLayer);
         }
      });
   });
}
