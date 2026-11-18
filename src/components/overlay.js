import { t } from '../services/i18n.js';
import { icon } from './icons.js';

/**
 * Shows a generic overlay for async processes with logging, success, and error states.
 * 
 * @param {HTMLElement} parentElement - The DOM element to append the overlay to (usually document.body or a specific container).
 * @param {string} title - The initial title of the overlay.
 * @param {Function} promiseAction - A function that returns a Promise. It receives an `addLog` function as an argument.
 * @param {object} options - Optional configuration.
 * @param {Function} options.onClose - Callback when the overlay is closed (success or error).
 * @param {boolean} options.autoClose - Whether to auto-close on success (default: false).
 * @param {number} options.autoCloseDelay - Delay in ms for auto-close (default: 2000).
 */
export function showProcessOverlay(parentElement, title, promiseAction, options = {}) {
    const overlay = document.createElement('div');
    overlay.className = "hj-backdrop absolute inset-0 z-[100] flex items-center justify-center p-5 transition-opacity duration-200";

    // Ensure parent is relative or static so absolute works, but usually we attach to #app which is relative/static.
    // Ideally parent should be relative if we want it strictly inside. 
    // If parent is body, fixed might be better, but existing code used absolute on #app.
    // Let's stick to absolute for now as per existing pattern.

    parentElement.appendChild(overlay);

    const logs = [];

    const render = (result = null, error = null) => {
        const linesHtml = logs.map(line =>
            `<div class="hj-log-line text-xs leading-relaxed font-mono ${LOG_LEVEL_CLASSES[line?.level] || 'text-ivory/60'} border-l ${error ? 'border-ember-400/50' : 'border-ivory/15'} pl-3 py-0.5 text-left [overflow-wrap:anywhere]">
                ${escapeHtml(line?.text ?? line)}
            </div>`
        ).join('');

        let content = `
            <div class="hj-dialog ${error ? 'hj-dialog-error' : ''} flex flex-col items-center w-full max-w-sm p-6">
                ${getHeaderIcon(result, error)}
                <h2 class="hj-wordmark text-[1.9rem] mb-5 text-center">
                   <span>${getHeaderText(title, result, error)}</span>
                </h2>
                
                <div class="w-full space-y-1.5 mb-6 max-h-60 overflow-y-auto custom-scrollbar border border-ivory/10 p-4 rounded-2xl">
                   ${linesHtml}
                   ${!result && !error ? '<div class="h-1.5 w-1.5 bg-ember-400 rounded-full animate-pulse mt-2 ml-3"></div>' : ''}
                </div>
        `;

        if (error) {
            content += `
                <div class="w-full text-ember-300 p-4 rounded-2xl text-xs leading-relaxed font-mono mb-5 break-words custom-scrollbar overflow-auto max-h-32 border border-ember-400/35">
                   ${escapeHtml(error.message || String(error))}
                </div>
                <button id="overlay-close-btn" class="hj-btn hj-btn-ghost w-full">
                    ${t('general.close')}
                </button>
            `;
        } else if (result) {
            // Success State
            if (result.id) {
                // Show Node Info if available (OSM specific)
                content += `
                   <div class="w-full rounded-2xl p-4 mb-5 text-left space-y-2.5 border border-ivory/15">
                      <div class="flex items-center justify-between text-xs">
                           <span class="hj-eyebrow">${t('messages.node_id') || 'Node ID'}</span>
                           <span class="text-ivory font-mono select-all">#${escapeHtml(result.id)}</span>
                      </div>
                       <div class="flex items-center justify-between text-xs">
                           <span class="hj-eyebrow">${t('messages.changeset') || 'Changeset'}</span>
                           <span class="text-ivory font-mono select-all">#${escapeHtml(result.changeset || '?')}</span>
                      </div>
                   </div>
                 `;
            }

            content += `
                <button id="overlay-close-btn" class="hj-btn hj-btn-light w-full">
                    ${t('general.done')}
                </button>
            `;
        } else {
            // Loading State
            content += `
                <div class="flex justify-center py-2">
                    <div class="hj-spinner w-7 h-7"></div>
                </div>
             `;
        }

        content += `</div>`;
        overlay.innerHTML = content;

        // Bind Events
        const closeBtn = overlay.querySelector('#overlay-close-btn');
        if (closeBtn) {
            closeBtn.onclick = () => {
                closeOverlay(overlay, options.onClose, error, result);
            };
        }
    };

    const addLog = (msg) => {
        logs.push(msg);
        render(); // Re-render to show log
    };

    // Initial Render
    render();

    // Execute Promise
    promiseAction(addLog)
        .then(res => {
            render(res || true); // Pass true if res is void, to trigger success state

            // Play Sound safely
            import('../services/audio.js')
                .then(({ playSuccessSound }) => playSuccessSound())
                .catch(() => { });

            if (options.autoClose) {
                setTimeout(() => {
                    closeOverlay(overlay, options.onClose, null, res);
                }, options.autoCloseDelay || 2000);
            }
        })
        .catch(err => {
            console.error("Overlay Process Error:", err);
            render(null, err);
            // Play Error Sound safely
            import('../services/audio.js')
                .then(({ playErrorSound }) => playErrorSound && playErrorSound()) // Assuming playErrorSound exists or adding it later
                .catch(() => { });
        });
}

// Log lines may be plain strings or `{ level, text }` objects. The level only
// selects one of these fixed class names; the text is always escaped.
const LOG_LEVEL_CLASSES = {
    req: 'text-ivory/40',
    res: 'text-ivory/80',
    info: 'text-ivory/60',
    success: 'text-ivory',
    err: 'text-ember-300'
};

function closeOverlay(overlay, onCloseCallback, error, result) {
    overlay.classList.add('opacity-0'); // Fade out effect if CSS supports it
    setTimeout(() => {
        overlay.remove();
        if (onCloseCallback) onCloseCallback(error ? null : result); // Return result on success
    }, 200);
}

function getHeaderIcon(result, error) {
    if (error) return `<div class="hj-medallion hj-medallion-ember mb-4">${icon('close', 'w-6 h-6')}</div>`;
    if (result) return `<div class="hj-medallion hj-medallion-aqua mb-4">${icon('check', 'w-6 h-6')}</div>`;
    return '';
}

function getHeaderText(title, result, error) {
    if (error) return t('general.error');
    if (result) return t('general.success');
    return title;
}

function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
/**
 * Shows a simple message overlay (Info/Error)
 * @param {HTMLElement} parentElement 
 * @param {string} title 
 * @param {string} message 
 * @param {string} type - 'info', 'error', 'success'
 * @param {Function} onClose 
 */
export function showMessageOverlay(parentElement, title, message, type = 'info', onClose = null) {
    const overlay = document.createElement('div');
    overlay.className = "hj-backdrop absolute inset-0 z-[100] flex items-center justify-center p-5 transition-opacity duration-200";

    parentElement.appendChild(overlay);

    let iconName = 'info';
    let medallion = '';
    let borderColor = '';

    if (type === 'error') {
        iconName = 'alert';
        medallion = 'hj-medallion-ember';
        borderColor = 'hj-dialog-error';
    } else if (type === 'success') {
        iconName = 'check';
    }

    const content = `
        <div class="hj-dialog ${borderColor} flex flex-col items-center w-full max-w-sm p-6">
            <div class="hj-medallion ${medallion} mb-4">${icon(iconName, 'w-6 h-6')}</div>
            <h2 class="hj-wordmark text-[1.9rem] mb-3 text-center">
                <span>${escapeHtml(title)}</span>
            </h2>
            
            <div class="text-ivory/65 text-center mb-6 text-sm leading-relaxed">
                ${escapeHtml(message)}
            </div>

            <button id="msg-overlay-close-btn" class="hj-btn hj-btn-light w-full">
                ${t('general.close')}
            </button>
        </div>
    `;

    overlay.innerHTML = content;

    const closeObj = () => {
        overlay.classList.add('opacity-0');
        setTimeout(() => {
            overlay.remove();
            if (onClose) onClose();
        }, 200);
    };

    const btn = overlay.querySelector('#msg-overlay-close-btn');
    if (btn) btn.onclick = closeObj;
}

/**
 * Shows a confirmation overlay (Yes/No)
 * @param {HTMLElement} parentElement 
 * @param {string} title 
 * @param {string} message 
 * @param {Function} onConfirm 
 * @param {Function} onCancel 
 */
export function showConfirmOverlay(parentElement, title, message, onConfirm, onCancel = null) {
    const overlay = document.createElement('div');
    overlay.className = "hj-backdrop absolute inset-0 z-[100] flex items-center justify-center p-5 transition-opacity duration-200";

    parentElement.appendChild(overlay);

    const content = `
        <div class="hj-dialog flex flex-col items-center w-full max-w-sm p-6">
            <div class="hj-medallion hj-medallion-ember mb-4">${icon('alert', 'w-6 h-6')}</div>
            <h2 class="hj-wordmark text-[1.9rem] mb-3 text-center">
                <span>${escapeHtml(title)}</span>
            </h2>
            
            <div class="text-ivory/65 text-center mb-7 text-sm leading-relaxed">
                ${escapeHtml(message)}
            </div>

            <div class="grid grid-cols-2 gap-2 w-full">
                <button id="confirm-no-btn" class="hj-btn hj-btn-ghost w-full">
                    ${t('general.cancel')}
                </button>
                <button id="confirm-yes-btn" class="hj-btn hj-btn-primary w-full">
                    OK
                </button>
            </div>
        </div>
    `;

    overlay.innerHTML = content;

    const close = () => {
        overlay.classList.add('opacity-0');
        setTimeout(() => overlay.remove(), 200);
    };

    overlay.querySelector('#confirm-no-btn').onclick = () => {
        close();
        if (onCancel) onCancel();
    };

    overlay.querySelector('#confirm-yes-btn').onclick = () => {
        close();
        if (onConfirm) onConfirm();
    };
}
