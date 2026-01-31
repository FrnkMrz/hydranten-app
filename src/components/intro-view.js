import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
// Fix for Leaflet default icon issues in Vite/Webpack
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { getLastKnownPosition, updatePosition } from '../services/geo.js';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
   iconRetinaUrl: markerIcon2x,
   iconUrl: markerIcon,
   shadowUrl: markerShadow,
});

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
             <p class="text-gray-400 text-xs font-bold uppercase tracking-widest opacity-80">OpenStreetMap Tool</p>
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
      <div class="h-auto shrink-0 z-10 w-full max-w-sm mx-auto flex flex-col justify-end px-6 pb-8">
          <button id="start-btn" class="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-red-900/30 active:scale-95 transition-all flex items-center justify-center gap-2 mb-4">
             STARTEN 🚀
          </button>
          
          <button id="intro-settings-btn" class="w-full py-3 flex items-center justify-center gap-2 ${loginClass} transition-colors text-sm font-medium hover:bg-white/5 rounded-xl">
             <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
             ${loginText}
          </button>
         
   
    </div>
   `;
}

export function initIntroView(element, onStart, onSettings) {
   const btn = element.querySelector('#start-btn');
   if (btn) {
      btn.onclick = () => {
         onStart();
      };
   }

   const settingsBtn = element.querySelector('#intro-settings-btn');
   if (settingsBtn && onSettings) {
      settingsBtn.onclick = onSettings;
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
      map = L.map(mapContainer, {
         zoomControl: false,
         attributionControl: false,
         dragging: false,
         scrollWheelZoom: false,
         doubleClickZoom: false,
         boxZoom: false,
         keyboard: false
      }).setView(initialCenter, initialZoom);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
         opacity: 0.8
      }).addTo(map);

      if (lastPos) {
         marker = L.marker(initialCenter).addTo(map);
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
