// src/components/history-view.js
import { auth, checkLogin } from '../services/auth.js';

export function renderHistoryView() {
  return `
    <div class="h-full w-full bg-slate-900 text-white flex flex-col p-6 animate-fade-in relative overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8 z-10">
        <h1 class="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Verlauf (Debug)
        </h1>
      </div>

      <!-- Content Area -->
      <div id="history-content" class="flex-1 overflow-auto custom-scrollbar flex flex-col gap-4 z-10">
         <div class="flex items-center justify-center h-full text-gray-500">
            <span class="animate-pulse">Lade Daten...</span>
         </div>
      </div>

      <!-- Footer / Back Button -->
      <div class="z-10 mt-auto pt-4 border-t border-gray-800">
         <button id="history-back-btn" class="w-full py-4 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-bold transition">
            Zurück
         </button>
      </div>
    </div>
  `;
}

export function initHistoryView(element, onBack) {
  const backBtn = element.querySelector('#history-back-btn');
  const contentDiv = element.querySelector('#history-content');

  if (backBtn && onBack) {
    backBtn.onclick = onBack;
  }

  // Load Data
  loadHistory(contentDiv);
}

async function loadHistory(container) {
  try {
    const username = await checkLogin();
    if (!username || username.startsWith('Error')) {
      container.innerHTML = `<div class="text-red-400 text-center">Nicht eingeloggt oder Fehler beim User-Check.</div>`;
      return;
    }

    // Fetch Changesets (Local Implementation to avoid touching osm.js)
    const url = `https://api.openstreetmap.org/api/0.6/changesets?display_name=${encodeURIComponent(username)}&limit=10&closed=true`;
    console.log("[History] Fetching:", url);

    const res = await fetch(url); // Public data, auth header not strictly needed for reading public changesets usually

    if (!res.ok) throw new Error(`API Error: ${res.status}`);

    const text = await res.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, "text/xml");
    const changesets = Array.from(xml.querySelectorAll('changeset'));

    if (changesets.length === 0) {
      container.innerHTML = `<div class="text-gray-500 text-center">Keine Changesets gefunden.</div>`;
      return;
    }

    const itemsHtml = changesets.map(cs => {
      const id = cs.getAttribute('id');
      const date = new Date(cs.getAttribute('created_at')).toLocaleString();
      let comment = '(Kein Kommentar)';
      let createdBy = '';

      cs.querySelectorAll('tag').forEach(t => {
        if (t.getAttribute('k') === 'comment') comment = t.getAttribute('v');
        if (t.getAttribute('k') === 'created_by') createdBy = t.getAttribute('v');
      });

      const isMyApp = createdBy.includes('Hydranten');
      const bgClass = isMyApp ? 'bg-blue-900/20 border-blue-500/30' : 'bg-gray-800/50 border-gray-700';

      return `
                <div class="p-4 rounded-xl border ${bgClass} text-sm">
                    <div class="flex justify-between mb-1">
                        <span class="font-bold text-gray-300">#${id}</span>
                        <span class="text-gray-500 text-xs">${date}</span>
                    </div>
                    <div class="text-gray-200 break-words mb-2">
                        ${comment}
                    </div>
                    <div class="text-xs text-gray-600 font-mono truncate">
                        ${createdBy}
                    </div>
                </div>
            `;
    }).join('');

    container.innerHTML = itemsHtml;

  } catch (err) {
    console.error("[History] Load Error:", err);
    container.innerHTML = `<div class="text-red-400 text-center p-4">Fehler beim Laden:<br>${err.message}</div>`;
  }
}
