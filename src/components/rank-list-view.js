import { t } from '../services/i18n.js';
import { RANKS, getRank } from '../services/gamification.js';
import { getRankBadgeSVG } from '../services/rank-graphics.js';
import { icon } from './icons.js';

export function renderRankListView() {
    return `
    <div class="hj-screen h-full w-full flex flex-col px-5 pb-5 pt-safe animate-fade-in relative overflow-hidden">

        <!-- Header -->
        <div class="flex items-center justify-between w-full mt-4 mb-5 z-10">
            <button id="rank-list-back-btn" class="hj-fab" aria-label="${t('settings.back_btn')}">
                ${icon('arrowLeft')}
            </button>
            <h1 class="hj-wordmark text-[2rem]">${t('gamification.list_title')}</h1>
            <div class="w-[2.875rem]"></div> <!-- Spacer -->
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
        let bgClass = "border-ivory/5";
        if (isCurrent) bgClass = "border-ivory/80 bg-ivory/[0.06]";
        else if (isUnlocked) bgClass = "border-ivory/15";

        let opacityClass = isUnlocked ? "opacity-100" : "opacity-50 grayscale";
        if (isCurrent) opacityClass = "opacity-100"; // Ensure current is fully visible

        return `
            <div class="flex items-center gap-4 p-4 rounded-2xl border ${bgClass} ${opacityClass} transition-all">
                <div class="w-16 h-16 flex-shrink-0 flex items-center justify-center">
                    ${badge}
                </div>
                <div class="flex-grow">
                    <div class="flex justify-between items-center">
                        <h3 class="hj-wordmark text-[1.4rem] ${isCurrent ? '' : 'text-ivory/80'}">${rank.name}</h3>
                        ${isCurrent ? '' : ''}
                    </div>
                    <p class="hj-eyebrow mt-1 text-[9px]">${t('gamification.from_hydrants').replace('{count}', rank.min)}</p>
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
