export function renderIntroView() {
    return `
    <div class="h-full w-full bg-slate-900 text-white flex flex-col items-center justify-between p-8 animate-fade-in relative overflow-hidden">
      
      <!-- Background / Decoration -->
      <div class="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-red-900/20 to-transparent pointer-events-none"></div>
      
      <!-- Content -->
      <div class="flex flex-col items-center z-10 mt-10">
         <div class="w-24 h-24 bg-gradient-to-tr from-red-500 to-orange-600 rounded-3xl shadow-2xl flex items-center justify-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M2 12h20" stroke-opacity="0.2" /><circle cx="12" cy="12" r="10" stroke="white" stroke-width="3" /></svg>
         </div>
         
         <h1 class="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Hydranten Jäger</h1>
         <p class="text-gray-400 text-center max-w-xs">Hilf mit, die Feuerwehr-Infrastruktur zu kartieren.</p>
      </div>

      <!-- Feature List -->
      <div class="w-full space-y-6 z-10 my-8">
          <div class="flex items-center gap-4 bg-gray-800/40 p-4 rounded-xl backdrop-blur-sm border border-gray-700/50">
             <span class="text-2xl">📸</span>
             <div>
                <h3 class="font-bold text-sm">Foto machen</h3>
                <p class="text-xs text-gray-500">Erfasse den Hydranten visuell.</p>
             </div>
          </div>
          
          <div class="flex items-center gap-4 bg-gray-800/40 p-4 rounded-xl backdrop-blur-sm border border-gray-700/50">
             <span class="text-2xl">📍</span>
             <div>
                <h3 class="font-bold text-sm">Standort prüfen</h3>
                <p class="text-xs text-gray-500">Automatische GPS-Verortung.</p>
             </div>
          </div>
          
           <div class="flex items-center gap-4 bg-gray-800/40 p-4 rounded-xl backdrop-blur-sm border border-gray-700/50">
             <span class="text-2xl">🌍</span>
             <div>
                <h3 class="font-bold text-sm">Hochladen</h3>
                <p class="text-xs text-gray-500">Direkt in OpenStreetMap speichern.</p>
             </div>
          </div>
      </div>

      <!-- Action -->
      <button id="start-btn" class="w-full py-4 bg-white text-black rounded-xl font-bold text-lg shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-95 transition-all z-10">
        Loslegen 🚀
      </button>

      <p class="text-xs text-gray-600 mt-4 text-center z-10">Kostenlos & Open Source</p>
    </div>
  `;
}

export function initIntroView(element, onStart) {
    const btn = element.querySelector('#start-btn');
    btn.onclick = () => {
        // Add minimal exit animation logic here if desired
        onStart();
    };
}
