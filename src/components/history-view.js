// src/components/history-view.js

export function renderHistoryView() {
    return `
    <div class="h-full w-full bg-slate-900 text-white flex flex-col p-6 animate-fade-in relative overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8 z-10">
        <h1 class="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Verlauf
        </h1>
      </div>

      <!-- Empty Content for now -->
      <div class="flex-1 overflow-auto custom-scrollbar flex items-center justify-center text-gray-500">
         <p>Hier entsteht der Verlauf...</p>
      </div>

      <!-- Footer / Back Button -->
      <div class="z-10 mt-auto pt-4 border-t border-gray-800">
         <button id="history-back-btn" class="w-full py-4 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-bold transition">
            Zurück
         </button>
      </div>
      
      <!-- Background Blobs -->
      <div class="absolute top-[-10%] right-[-10%] w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
    </div>
  `;
}

export function initHistoryView(element, onBack) {
    const backBtn = element.querySelector('#history-back-btn');
    if (backBtn && onBack) {
        backBtn.onclick = onBack;
    }
}
