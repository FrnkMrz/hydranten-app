import { auth, checkLogin } from '../services/auth.js';
import { fetchUserChangesets } from '../services/osm.js';
import { t } from '../services/i18n.js';
import { escapeHTML } from '../utils/security.js';

export function renderHistoryView() {
  return `
    <div class="h-full w-full bg-slate-900 text-white flex flex-col p-6 pt-safe animate-fade-in relative overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8 z-10">
        <h1 class="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          ${t('history.title')}
        </h1>
      </div>

      <!-- Content Area -->
      <div id="history-content" class="flex-1 overflow-auto custom-scrollbar flex flex-col gap-4 z-10">
         <div class="flex items-center justify-center h-full text-gray-500">
            <span class="animate-pulse">${t('history.loading')}</span>
         </div>
      </div>

      <!-- Footer / Back Button -->
      <div class="z-10 mt-auto pt-4 border-t border-gray-800 text-center">
         <p class="text-[10px] text-gray-600 mb-2 font-mono">
            Source: api.openstreetmap.org
         </p>
         <button id="history-back-btn" class="w-full py-4 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-bold transition">
            ${t('history.back_btn')}
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
      container.innerHTML = `<div class="text-red-400 text-center">${t('history.not_logged_in')}</div>`;
      return;
    }

    // Fetch from Service
    const changesets = await fetchUserChangesets(username);

    if (changesets.length === 0) {
      container.innerHTML = `<div class="text-gray-500 text-center">${t('history.no_data')}</div>`;
      return;
    }

    const itemsHtml = changesets.map(cs => {
      // Security: Validate ID is numeric
      if (!/^\d+$/.test(cs.id)) {
        console.warn("Skipping invalid changeset ID:", cs.id);
        return '';
      }

      const date = new Date(cs.createdAt).toLocaleString();
      const comment = cs.comment || '(Kein Kommentar)';
      const isMyApp = (cs.createdBy || '').includes('Hydranten');
      const bgClass = isMyApp ? 'bg-blue-900/20 border-blue-500/30' : 'bg-gray-800/50 border-gray-700';

      return `
                <div class="p-4 rounded-xl border ${bgClass} text-sm">
                    <div class="flex justify-between mb-1">
                        <a href="https://www.openstreetmap.org/changeset/${cs.id}" target="_blank" rel="noopener noreferrer" class="font-bold text-blue-400 hover:text-blue-300 underline underline-offset-2">#${cs.id} ↗</a>
                        <span class="text-gray-500 text-xs">${date}</span>
                    </div>
                    <div class="text-gray-200 break-words mb-2">
                        ${escapeHTML(comment)}
                    </div>
                    <div class="text-xs text-gray-600 font-mono truncate">
                        ${escapeHTML(cs.createdBy || '')}
                    </div>
                </div>
            `;
    }).join('');

    container.innerHTML = itemsHtml;

  } catch (err) {
    console.error("[History] Load Error:", err);
    container.innerHTML = `<div class="text-red-400 text-center p-4">${t('history.error')}<br>${err.message}</div>`;
  }
}

