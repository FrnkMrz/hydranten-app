import { getRank, fetchUserHydrantCount } from '../services/gamification.js';
import { getRankBadgeSVG } from '../services/rank-graphics.js';
import { t } from '../services/i18n.js';

/**
 * Initializes the Gamification UI widget.
 * Fetches user data and updates the rank display.
 */
export function initGamificationWidget(element, username, onShowRankList) {
    if (!username || username.startsWith("Error")) return;

    const gameContainer = element.querySelector('#gamification-container');
    const rankBadge = element.querySelector('#rank-badge');
    const rankName = element.querySelector('#rank-name');
    const rankProgress = element.querySelector('#rank-progress');
    const rankCurrent = element.querySelector('#rank-current-count');
    const rankNext = element.querySelector('#rank-next-count');
    const rankMsg = element.querySelector('#rank-message');

    if (gameContainer) {
        fetchUserHydrantCount(username).then(count => {
            const rank = getRank(count);
            rankName.innerText = rank.current.name;
            rankCurrent.innerText = count;

            if (rank.next) {
                rankNext.innerText = rank.next.min;
                const pct = Math.min(100, Math.max(0, rank.progress * 100));
                rankProgress.style.width = `${pct}%`;

                // Localized message
                rankMsg.innerText = t('gamification.rank_progress')
                    .replace('{count}', rank.needed)
                    .replace('{rank}', rank.next.name);
            } else {
                rankNext.innerText = "MAX";
                rankProgress.style.width = '100%';
                rankMsg.innerText = t('gamification.rank_max');
            }

            const svg = getRankBadgeSVG(rank.current.id);
            rankBadge.innerHTML = svg.replace('width="64"', 'width="100%"').replace('height="64"', 'height="100%"');

            // Show Container
            gameContainer.classList.remove('hidden');

            if (onShowRankList) {
                gameContainer.style.cursor = 'pointer';
                gameContainer.onclick = () => onShowRankList(count);
            }
        }).catch(err => {
            console.error("[Gamification] Error fetching rank:", err);
        });
    }
}
