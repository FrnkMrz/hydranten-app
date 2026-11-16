import { t } from '../services/i18n.js';
import { RANKS, getRank } from '../services/gamification.js';
import { getRankBadgeSVG } from '../services/rank-graphics.js';

export function renderRankListView() {
    return `
    <div class="hj-screen h-full w-full flex flex-col px-5 pb-5 pt-safe animate-fade-in relative overflow-hidden">

        <!-- Header -->
        <div class="flex items-center justify-between w-full mt-4 mb-5 z-10">
            <button id="rank-list-back-btn" class="hj-fab" aria-label="${t('settings.back_btn')}">
                <svg aria-hidden="true" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M15 19l-7-7 7-7"></path></svg>
            </button>
            <h1 class="hj-wordmark text-2xl text-white">${t('gamification.list_title')}</h1>
            <div class="w-12"></div> <!-- Spacer -->
        </div>

        <!-- List -->
        <div class="flex-grow overflow-y-auto space-y-3 pr-1 custom-scrollbar z-10" id="rank-list-container">
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
    container.innerHTML = RANKS.map((rank, _index) => {
        const isUnlocked = currentHydrantCount >= rank.min; // Reached
        const isCurrent = currentRank.id === rank.id;

        const badge = getRankBadgeSVG(rank.id).replace('width="64"', 'width="48"').replace('height="64"', 'height="48"');

        // Style Logic
        let bgClass = "bg-white/[0.03] border-white/5";
        if (isCurrent) bgClass = "bg-gradient-to-br from-ember-500/25 to-ink-950/40 border-ember-400 shadow-[0_18px_36px_-20px_rgba(255,90,43,0.9)]";
        else if (isUnlocked) bgClass = "bg-white/[0.07] border-white/10";

        let opacityClass = isUnlocked ? "opacity-100" : "opacity-50 grayscale";
        if (isCurrent) opacityClass = "opacity-100"; // Ensure current is fully visible

        return `
            <div class="flex items-center gap-4 p-4 rounded-2xl border ${bgClass} ${opacityClass} transition-all">
                <div class="w-16 h-16 flex-shrink-0 flex items-center justify-center">
                    ${badge}
                </div>
                <div class="flex-grow">
                    <div class="flex justify-between items-center">
                        <h3 class="font-bold text-lg tracking-tight ${isCurrent ? 'text-white' : 'text-white/80'}">${rank.name}</h3>
                        ${isCurrent ? '' : ''}
                    </div>
                    <p class="text-xs text-white/45 font-mono">${t('gamification.from_hydrants').replace('{count}', rank.min)}</p>
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
