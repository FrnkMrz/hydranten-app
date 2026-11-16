import { t } from '../services/i18n.js';

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
            `<div class="text-sm font-mono ${LOG_LEVEL_CLASSES[line?.level] || 'text-gray-400'} border-l-2 ${error ? 'border-red-500/40' : 'border-white/10'} pl-3 py-1 text-left break-all">
                ${escapeHtml(line?.text ?? line)}
            </div>`
        ).join('');

        let content = `
            <div class="hj-dialog ${error ? 'hj-dialog-error' : ''} flex flex-col w-full max-w-sm p-6">
                <h2 class="text-xl font-extrabold tracking-tight ${error ? 'text-red-400' : 'text-white'} mb-4 flex items-center justify-center gap-2">
                   ${getHeaderIcon(result, error)} 
                   <span>${getHeaderText(title, result, error)}</span>
                </h2>
                
                <div class="space-y-1 mb-6 max-h-60 overflow-y-auto custom-scrollbar bg-black/30 border border-white/5 p-3 rounded-2xl">
                   ${linesHtml}
                   ${!result && !error ? '<div class="h-2 w-2 bg-ember-400 rounded-full animate-ping mt-2"></div>' : ''}
                </div>
        `;

        if (error) {
            content += `
                <div class="bg-red-500/10 text-red-200 p-3 rounded-2xl text-xs font-mono mb-4 break-words custom-scrollbar overflow-auto max-h-32 border border-red-500/25">
                   ${escapeHtml(error.message || String(error))}
                </div>
                <button id="overlay-close-btn" class="hj-btn hj-btn-danger-solid w-full">
                    ${t('general.close')}
                </button>
            `;
        } else if (result) {
            // Success State
            if (result.id) {
                // Show Node Info if available (OSM specific)
                content += `
                   <div class="w-full bg-emerald-500/[0.08] rounded-2xl p-4 mb-4 text-left space-y-2 border border-emerald-400/30">
                      <div class="flex justify-between text-xs">
                           <span class="text-white/50">${t('messages.node_id') || 'Node ID'}</span>
                           <span class="text-white font-mono font-bold select-all">#${escapeHtml(result.id)}</span>
                      </div>
                       <div class="flex justify-between text-xs">
                           <span class="text-white/50">${t('messages.changeset') || 'Changeset'}</span>
                           <span class="text-white font-mono select-all">#${escapeHtml(result.changeset || '?')}</span>
                      </div>
                   </div>
                 `;
            }

            content += `
                <button id="overlay-close-btn" class="hj-btn hj-btn-success w-full">
                    ${t('general.done')}
                </button>
            `;
        } else {
            // Loading State
            content += `
                <div class="flex justify-center py-2">
                    <div class="hj-spinner w-9 h-9"></div>
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
    req: 'text-blue-400 font-bold',
    res: 'text-purple-400 font-bold',
    info: 'text-yellow-400',
    success: 'text-green-400 font-bold',
    err: 'text-red-500 font-bold'
};

function closeOverlay(overlay, onCloseCallback, error, result) {
    overlay.classList.add('opacity-0'); // Fade out effect if CSS supports it
    setTimeout(() => {
        overlay.remove();
        if (onCloseCallback) onCloseCallback(error ? null : result); // Return result on success
    }, 200);
}

function getHeaderIcon(result, error) {
    if (error) return '❌';
    if (result) return '✅';
    return '';
}

function getHeaderText(title, result, error) {
    if (error) return t('general.error');
    if (result) return t('general.success') + '!';
    return title + '...';
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

    let icon = 'ℹ️';
    let titleColor = 'text-white';
    let borderColor = '';

    if (type === 'error') {
        icon = '❌';
        titleColor = 'text-red-400';
        borderColor = 'hj-dialog-error';
    } else if (type === 'success') {
        icon = '✅';
        titleColor = 'text-emerald-300';
        borderColor = '';
    }

    const content = `
        <div class="hj-dialog ${borderColor} flex flex-col w-full max-w-sm p-6">
            <h2 class="text-xl font-extrabold tracking-tight ${titleColor} mb-4 flex items-center justify-center gap-2">
                <span class="text-2xl">${icon}</span>
                <span>${escapeHtml(title)}</span>
            </h2>
            
            <div class="text-white/70 text-center mb-6 text-sm leading-relaxed">
                ${escapeHtml(message)}
            </div>

            <button id="msg-overlay-close-btn" class="hj-btn hj-btn-ghost w-full">
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
        <div class="hj-dialog flex flex-col w-full max-w-sm p-6">
            <h2 class="text-xl font-extrabold tracking-tight text-white mb-4 flex items-center justify-center gap-2">
                <span class="text-2xl">⚠️</span>
                <span>${escapeHtml(title)}</span>
            </h2>
            
            <div class="text-white/70 text-center mb-7 text-sm leading-relaxed">
                ${escapeHtml(message)}
            </div>

            <div class="grid grid-cols-2 gap-3">
                <button id="confirm-no-btn" class="hj-btn hj-btn-ghost w-full">
                    ${t('general.cancel')}
                </button>
                <button id="confirm-yes-btn" class="hj-btn hj-btn-danger-solid w-full">
                    ${t('general.ok') || 'OK'}
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
