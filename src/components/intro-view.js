import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
// Fix for Leaflet default icon issues in Vite/Webpack
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { getLastKnownPosition } from '../services/geo.js';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
   iconRetinaUrl: markerIcon2x,
   iconUrl: markerIcon,
   shadowUrl: markerShadow,
});

export function renderIntroView() {
   return `
    <div class="h-full w-full bg-white text-gray-900 flex flex-col relative overflow-hidden">
      
      <!-- Top 30% Map -->
      <div class="w-full h-[30%] shrink-0 relative z-0">
          <div id="intro-map" class="w-full h-full"></div>
          <!-- Gradient Overlay -->
          <div class="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
      </div>

      <!-- Top Bar (Settings) -->
      <div class="absolute top-0 right-0 p-4 z-20">
         <button id="intro-settings-btn" class="p-3 h-12 w-12 flex items-center justify-center bg-white/50 hover:bg-white/80 backdrop-blur-md rounded-full text-gray-900 transition border border-gray-200 shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
         </button>
      </div>

      <!-- Content (Bottom 70%) -->
      <div class="flex-grow flex flex-col items-center z-10 w-full max-w-sm mx-auto px-6 overflow-y-auto pb-4">
         
         <!-- Hero Title (Immediately below map with some spacing) -->
         <div class="text-center mt-6 mb-8">
             <h1 class="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight drop-shadow-sm">
                Hydranten <span class="text-red-500">Jäger</span>
             </h1>
             <p class="text-gray-500 text-xs font-bold uppercase tracking-widest opacity-80">OpenStreetMap Tool</p>
         </div>

         <!-- Instructions Card -->
         <div class="w-full bg-gray-50 rounded-2xl p-5 border border-gray-100 space-y-3 text-sm text-gray-600 shadow-lg">
             <div class="flex items-center gap-4">
                <span class="text-xl bg-gray-200 p-2 rounded-lg">📏</span> <p><span class="text-gray-900 font-bold">3 Meter</span> Abstand</p>
             </div>
             <div class="flex items-center gap-4">
                <span class="text-xl bg-gray-200 p-2 rounded-lg">📸</span> <p><span class="text-gray-900 font-bold">Foto</span> machen</p>
             </div>
             <div class="flex items-center gap-4">
                <span class="text-xl bg-gray-200 p-2 rounded-lg">✏️</span> <p><span class="text-gray-900 font-bold">Daten</span> ergänzen</p>
             </div>
             <div class="flex items-center gap-4">
                <span class="text-xl bg-gray-200 p-2 rounded-lg">☁️</span> <p><span class="text-gray-900 font-bold">Hochladen</span> zu OSM</p>
             </div>
         </div>
      </div>

      <!-- Footer Action -->
      <div class="h-auto shrink-0 z-10 w-full max-w-sm mx-auto flex flex-col justify-end px-6 pb-8">
         <button id="start-btn" class="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-red-900/30 active:scale-95 transition-all flex items-center justify-center gap-2 mb-4">
            STARTEN 🚀
         </button>
         
         <button id="intro-settings-btn" class="w-full py-3 flex items-center justify-center gap-2 text-gray-400 hover:text-gray-800 transition-colors text-sm font-medium hover:bg-gray-100 rounded-xl">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            OSM Login & Einstellungen
         </button>
      </div>
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
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;

            if (map) {
               map.setView([lat, lng], 18);
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
   }
}
