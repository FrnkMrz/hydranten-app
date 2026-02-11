import { t } from '../services/i18n.js';
import { RANKS, getRank } from '../services/gamification.js';
import { getRankBadgeSVG } from '../services/rank-graphics.js';

export function renderRankListView() {
    return `
    <div class="h-full w-full bg-slate-900 text-white flex flex-col p-6 animate-fade-in relative overflow-hidden">
        <!-- Background Decorative -->
        <div class="absolute -top-20 -right-20 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <!-- Header -->
        <div class="flex items-center justify-between w-full mb-6 z-10">
            <button id="rank-list-back-btn" class="p-3 bg-gray-800 rounded-xl hover:bg-gray-700 transition">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
            </button>
            <h1 class="text-2xl font-bold">Alle Dienstgrade</h1>
            <div class="w-12"></div> <!-- Spacer -->
        </div>

        <!-- List -->
        <div class="flex-grow overflow-y-auto space-y-4 pr-1 custom-scrollbar z-10" id="rank-list-container">
            <!-- Ranks will be injected here -->
        </div>
    </div>
  `;
}

export function initRankListView(element, onBack, currentHydrantCount = 0) {
    const backBtn = element.querySelector('#rank-list-back-btn');
    const container = element.querySelector('#rank-list-container');

    if (backBtn) backBtn.onclick = onBack;

    const currentRank = getRank(currentHydrantCount).current;

    // Render List
    container.innerHTML = RANKS.map((rank, index) => {
        const isUnlocked = currentHydrantCount >= rank.min; // Reached
        const isCurrent = currentRank.id === rank.id;

        const badge = getRankBadgeSVG(rank.id).replace('width="64"', 'width="48"').replace('height="64"', 'height="48"');

        // Style Logic
        let bgClass = "bg-gray-800/50 border-gray-700";
        if (isCurrent) bgClass = "bg-gradient-to-br from-red-900/40 to-black border-red-500 shadow-lg shadow-red-900/20";
        else if (isUnlocked) bgClass = "bg-gray-800 border-gray-600";

        let opacityClass = isUnlocked ? "opacity-100" : "opacity-50 grayscale";
        if (isCurrent) opacityClass = "opacity-100"; // Ensure current is fully visible

        return `
            <div class="flex items-center gap-4 p-4 rounded-2xl border ${bgClass} ${opacityClass} transition-all">
                <div class="w-16 h-16 flex-shrink-0 flex items-center justify-center">
                    ${badge}
                </div>
                <div class="flex-grow">
                    <div class="flex justify-between items-center">
                        <h3 class="font-bold text-lg ${isCurrent ? 'text-white' : 'text-gray-300'}">${rank.name}</h3>
                        ${isCurrent ? '' : ''}
                    </div>
                    <p class="text-sm text-gray-400 font-mono">ab ${rank.min} Hydranten</p>
                </div>
            </div>
        `;
    }).join('');

    // Auto-scroll to current rank
    setTimeout(() => {
        const currentEl = container.children[RANKS.findIndex(r => r.id === currentRank.id)];
        if (currentEl) {
            currentEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, 100);
}
