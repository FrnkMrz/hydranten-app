import { t } from '../services/i18n.js';

const DEFAULT_TIMINGS = {
    showDelayMs: 500,
    slowDelayMs: 6000,
    successDurationMs: 1600
};

const BASE_CLASSES = 'absolute top-safe-4 left-1/2 z-[401] flex max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-medium text-white shadow-lg backdrop-blur-md transition-all pointer-events-none';

function createIndicator(state) {
    const indicator = document.createElement('span');
    indicator.setAttribute('aria-hidden', 'true');

    if (state === 'loading') {
        indicator.className = 'h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-blue-300 border-t-transparent';
    } else {
        const color = state === 'success' ? 'bg-green-400' : 'bg-amber-400';
        indicator.className = `h-2.5 w-2.5 shrink-0 rounded-full ${color}`;
    }

    return indicator;
}

export function createHydrantLoadStatus(root, onRetry, timings = {}) {
    const config = { ...DEFAULT_TIMINGS, ...timings };
    let showTimer = null;
    let slowTimer = null;
    let successTimer = null;
    let generation = 0;

    const clearTimers = () => {
        if (showTimer !== null) window.clearTimeout(showTimer);
        if (slowTimer !== null) window.clearTimeout(slowTimer);
        if (successTimer !== null) window.clearTimeout(successTimer);
        showTimer = null;
        slowTimer = null;
        successTimer = null;
    };

    const hide = () => {
        if (!root) return;
        root.className = 'hidden';
        root.removeAttribute('data-state');
        root.replaceChildren();
    };

    const render = (state, messageKey, withRetry = false) => {
        if (!root) return;

        const stateClasses = state === 'success'
            ? 'border-green-400/30 bg-gray-900/90'
            : state === 'loading'
                ? 'border-blue-400/25 bg-gray-900/85'
                : 'border-amber-400/30 bg-gray-900/90';

        root.className = `${BASE_CLASSES} ${stateClasses}`;
        root.dataset.state = state;
        root.replaceChildren();

        const message = document.createElement('span');
        message.className = 'min-w-0 leading-tight';
        message.textContent = t(messageKey);

        root.append(createIndicator(state), message);

        if (withRetry) {
            const retryButton = document.createElement('button');
            retryButton.id = 'hydrant-data-retry';
            retryButton.type = 'button';
            retryButton.className = 'pointer-events-auto ml-1 shrink-0 rounded-full bg-white/10 px-2.5 py-1 font-bold text-white transition hover:bg-white/20 active:scale-95';
            retryButton.textContent = t('general.retry');
            retryButton.addEventListener('click', () => onRetry?.());
            root.appendChild(retryButton);
        }
    };

    const setLoading = ({ immediate = false } = {}) => {
        clearTimers();
        const currentGeneration = ++generation;

        if (immediate) {
            render('loading', 'hydrant_data.loading');
        } else {
            hide();
            showTimer = window.setTimeout(() => {
                if (generation === currentGeneration) {
                    render('loading', 'hydrant_data.loading');
                }
            }, config.showDelayMs);
        }

        slowTimer = window.setTimeout(() => {
            if (generation === currentGeneration) {
                render('slow', 'hydrant_data.slow');
            }
        }, config.slowDelayMs);
    };

    const setSuccess = () => {
        const wasVisible = Boolean(root && !root.classList.contains('hidden'));
        clearTimers();
        generation++;

        if (!wasVisible) {
            hide();
            return;
        }

        render('success', 'hydrant_data.current');
        successTimer = window.setTimeout(hide, config.successDurationMs);
    };

    const setError = ({ hasCachedData = false } = {}) => {
        clearTimers();
        generation++;
        render(
            'error',
            hasCachedData ? 'hydrant_data.stale' : 'hydrant_data.unavailable',
            true
        );
    };

    return {
        setLoading,
        setSuccess,
        setError,
        hide() {
            clearTimers();
            generation++;
            hide();
        },
        destroy() {
            clearTimers();
            generation++;
            hide();
        }
    };
}
