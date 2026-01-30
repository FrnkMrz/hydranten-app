import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
// Fix for Leaflet default icon issues in Vite/Webpack
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
   iconRetinaUrl: markerIcon2x,
   iconUrl: markerIcon,
   shadowUrl: markerShadow,
});

export function renderIntroView() {
   return `
    <div class="h-full w-full bg-black text-white flex flex-col p-6 animate-fade-in relative overflow-hidden">
      
      <!-- Background -->
      <div class="absolute inset-0 bg-gradient-to-tr from-red-900/30 via-black to-slate-900 z-0 pointer-events-none"></div>
      
      <!-- Top Bar (Settings) -->
      <div class="w-full flex justify-end z-20 h-16 shrink-0">
         <button id="intro-settings-btn" class="p-3 h-12 w-12 flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition border border-white/10">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
         </button>
      </div>

      <!-- Main Content (Centered) -->
      <div class="flex-grow flex flex-col items-center justify-center space-y-8 z-10 w-full max-w-sm mx-auto">
         
         <!-- Hero -->
         <div class="flex flex-col items-center text-center w-full">
             <div class="relative mb-6 w-full max-w-[280px] h-48 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 bg-gray-800">
                <div id="intro-map" class="w-full h-full z-0"></div>
                <!-- Overlay Gradient to blend bottom -->
                <div class="absolute inset-0 pointer-events-none shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]"></div>
             </div>
             
             <h1 class="text-4xl font-extrabold text-white mb-2 tracking-tight">
                Hydranten <span class="text-red-500">Jäger</span>
             </h1>
             <p class="text-gray-400 text-xs font-bold uppercase tracking-widest opacity-80 mb-4">OpenStreetMap Tool</p>
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
      <div class="h-20 shrink-0 z-10 w-full max-w-sm mx-auto flex flex-col justify-end">
         <button id="start-btn" class="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-red-900/30 active:scale-95 transition-all flex items-center justify-center gap-2">
           STARTEN 🚀
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

   if (mapContainer && !map) {
      // Init Map centered on Munich (Fallback)
      map = L.map(mapContainer, {
         zoomControl: false, // Clean look
         attributionControl: false,
         dragging: false, // Static-ish map
         scrollWheelZoom: false,
         doubleClickZoom: false,
         boxZoom: false,
         keyboard: false
      }).setView([48.137, 11.576], 18);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
         opacity: 0.8 // Darken slightly for bg effect
      }).addTo(map);
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
