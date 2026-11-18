import { getRank, fetchUserHydrantCount, getCachedHydrantCount } from '../services/gamification.js';
import { getRankBadgeSVG } from '../services/rank-graphics.js';
import { t } from '../services/i18n.js';

/**
 * Initializes the Gamification UI widget.
 * Fetches user data and updates the rank display.
 *
 * The rank box is always visible for a logged-in user. It shows the last
 * known rank at once, refreshes it in the background, and says so plainly
 * when the count cannot be fetched instead of disappearing.
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
    const rankCounts = rankCurrent?.parentElement;
    const rankBar = rankProgress?.parentElement;
    // Parts that only make sense once a count is known.
    const rankParts = [rankBadge, rankName, rankBar, rankCounts].filter(Boolean);

    if (!gameContainer) return;

    // Settings renders once from the cached name and again after the network
    // check. Only the newest request may paint, so a slow answer for a
    // previous account can never overwrite the current user's rank.
    const requestId = String(Date.now() + Math.random());
    gameContainer.dataset.rankRequest = requestId;
    const isCurrent = () => gameContainer.dataset.rankRequest === requestId;

    const paintRank = count => {
        const rank = getRank(count);
        rankName.innerText = rank.current.name;
        rankCurrent.innerText = count;
        rankParts.forEach(part => part.classList.remove('hidden'));

        if (rank.next) {
            rankNext.innerText = rank.next.min;
            const pct = Math.min(100, Math.max(0, rank.progress * 100));
            rankProgress.style.width = `${pct}%`;
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
        gameContainer.dataset.rankUser = username;
        gameContainer.style.cursor = onShowRankList ? 'pointer' : '';
        gameContainer.onclick = onShowRankList ? () => onShowRankList(count) : null;
    };

    // No count yet: only a short note, never a made-up rank.
    const paintPending = (message, onRetry) => {
        rankParts.forEach(part => part.classList.add('hidden'));
        rankMsg.innerText = message;
        gameContainer.dataset.rankUser = '';
        gameContainer.style.cursor = onRetry ? 'pointer' : '';
        gameContainer.onclick = onRetry || null;
    };

    const load = () => {
        const cached = getCachedHydrantCount(username);
        if (cached) {
            paintRank(cached.count);
        } else if (gameContainer.dataset.rankUser !== username) {
            paintPending(t('gamification.rank_loading'));
        }
        gameContainer.classList.remove('hidden');
        if (cached?.fresh) return;

        fetchUserHydrantCount(username).then(count => {
            if (!isCurrent()) return;
            if (count === null || count === undefined) {
                // Unknown count: keep a shown rank, otherwise offer a retry.
                if (gameContainer.dataset.rankUser !== username) {
                    paintPending(t('gamification.rank_unavailable'), () => load());
                }
                return;
            }
            paintRank(count);
        }).catch(err => {
            console.error("[Gamification] Error fetching rank:", err);
        });
    };

    load();
}
