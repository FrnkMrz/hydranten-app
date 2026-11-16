import { checkLogin } from '../services/auth.js';
import { fetchUserChangesets } from '../services/osm.js';
import { t } from '../services/i18n.js';
import { escapeHTML } from '../utils/security.js';

export function renderHistoryView() {
  return `
    <div class="hj-screen h-full w-full flex flex-col px-5 pb-5 pt-safe animate-fade-in relative overflow-hidden">
      <!-- Header -->
      <div class="mt-4 mb-5 z-10">
        <p class="hj-eyebrow mb-1">OpenStreetMap</p>
        <h1 class="hj-wordmark text-3xl text-white">
          ${t('history.title')}
        </h1>
      </div>

      <!-- Content Area -->
      <div id="history-content" class="flex-1 overflow-auto custom-scrollbar flex flex-col gap-3 z-10">
         <div class="flex items-center justify-center h-full text-white/50">
            <span class="animate-pulse">${t('history.loading')}</span>
         </div>
      </div>

      <!-- Footer / Back Button -->
      <div class="z-10 mt-auto pt-3 text-center">
         <p class="text-[10px] text-white/30 mb-2 font-mono">
            Source: api.openstreetmap.org
         </p>
         <button id="history-back-btn" class="hj-btn hj-btn-ghost w-full">
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
      container.innerHTML = `<div class="text-gray-400 text-center">${t('history.no_data')}</div>`;
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
      const bgClass = isMyApp ? 'border-ember-500/40 bg-ember-500/10' : 'border-white/10 bg-white/5';

      return `
                <div class="p-4 rounded-2xl border ${bgClass} text-sm">
                    <div class="flex justify-between mb-1">
                        <a href="https://www.openstreetmap.org/changeset/${cs.id}" target="_blank" rel="noopener noreferrer" class="font-bold font-mono text-aqua-300 hover:text-aqua-400 underline underline-offset-4 decoration-aqua-400/40">#${cs.id} ↗</a>
                        <span class="text-white/45 text-xs tabular-nums">${date}</span>
                    </div>
                    <div class="text-white/85 break-words mb-2 leading-snug">
                        ${escapeHTML(comment)}
                    </div>
                    <div class="text-[11px] text-white/35 font-mono truncate">
                        ${escapeHTML(cs.createdBy || '')}
                    </div>
                </div>
            `;
    }).join('');

    container.innerHTML = itemsHtml;

  } catch (err) {
    console.error("[History] Load Error:", err);
    container.innerHTML = `<div class="text-red-400 text-center p-4">${t('history.error')}<br>${escapeHTML(err?.message || String(err))}</div>`;
  }
}

