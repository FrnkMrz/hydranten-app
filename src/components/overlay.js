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
    overlay.className = "absolute inset-0 bg-black/90 z-[100] flex items-center justify-center p-6 animate-fade-in backdrop-blur-sm";

    // Ensure parent is relative or static so absolute works, but usually we attach to #app which is relative/static.
    // Ideally parent should be relative if we want it strictly inside. 
    // If parent is body, fixed might be better, but existing code used absolute on #app.
    // Let's stick to absolute for now as per existing pattern.

    parentElement.appendChild(overlay);

    const logs = [];

    const render = (result = null, error = null) => {
        const linesHtml = logs.map(line =>
            `<div class="text-sm font-mono text-gray-400 border-l-2 ${error ? 'border-red-900 icon-shake' : 'border-gray-700'} pl-3 py-1 text-left break-all">
                ${escapeHtml(line)}
            </div>`
        ).join('');

        let content = `
            <div class="flex flex-col w-full max-w-sm bg-gray-900 border ${error ? 'border-red-500/50' : 'border-gray-700'} rounded-2xl p-6 shadow-2xl transition-all duration-300">
                <h2 class="text-xl font-bold ${error ? 'text-red-500' : 'text-white'} mb-4 flex items-center justify-center gap-2">
                   ${getHeaderIcon(result, error)} 
                   <span>${getHeaderText(title, result, error)}</span>
                </h2>
                
                <div class="space-y-1 mb-6 max-h-60 overflow-y-auto custom-scrollbar bg-black/20 p-2 rounded-lg">
                   ${linesHtml}
                   ${!result && !error ? '<div class="h-2 w-2 bg-blue-500 rounded-full animate-ping mt-2"></div>' : ''}
                </div>
        `;

        if (error) {
            content += `
                <div class="bg-red-900/20 text-red-200 p-3 rounded-lg text-xs font-mono mb-4 break-words custom-scrollbar overflow-auto max-h-32 border border-red-500/20">
                   ${escapeHtml(error.message || String(error))}
                </div>
                <button id="overlay-close-btn" class="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition shadow-lg shadow-red-900/20 active:scale-95">
                    ${t('general.close')}
                </button>
            `;
        } else if (result) {
            // Success State
            if (result.id) {
                // Show Node Info if available (OSM specific)
                content += `
                   <div class="w-full bg-gray-800 rounded-lg p-3 mb-4 text-left space-y-2 border border-green-500/30">
                      <div class="flex justify-between text-xs">
                           <span class="text-gray-400">${t('messages.node_id') || 'Node ID'}</span>
                           <span class="text-white font-mono font-bold select-all">#${result.id}</span>
                      </div>
                       <div class="flex justify-between text-xs">
                           <span class="text-gray-400">${t('messages.changeset') || 'Changeset'}</span>
                           <span class="text-white font-mono select-all">#${result.changeset || '?'}</span>
                      </div>
                   </div>
                 `;
            }

            content += `
                <button id="overlay-close-btn" class="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition border border-white/10 active:scale-95">
                    ${t('general.done')}
                </button>
            `;
        } else {
            // Loading State
            content += `
                <div class="flex justify-center py-2">
                    <div class="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
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
    overlay.className = "absolute inset-0 bg-black/80 z-[100] flex items-center justify-center p-6 animate-fade-in backdrop-blur-sm";

    parentElement.appendChild(overlay);

    let icon = 'ℹ️';
    let titleColor = 'text-white';
    let borderColor = 'border-gray-700';

    if (type === 'error') {
        icon = '❌';
        titleColor = 'text-red-500';
        borderColor = 'border-red-500/50';
    } else if (type === 'success') {
        icon = '✅';
        titleColor = 'text-green-500';
        borderColor = 'border-green-500/50';
    }

    const content = `
        <div class="flex flex-col w-full max-w-sm bg-gray-900 border ${borderColor} rounded-2xl p-6 shadow-2xl transition-all duration-300 transform scale-100">
            <h2 class="text-xl font-bold ${titleColor} mb-4 flex items-center justify-center gap-2">
                <span class="text-2xl">${icon}</span>
                <span>${escapeHtml(title)}</span>
            </h2>
            
            <div class="text-gray-300 text-center mb-6 text-sm leading-relaxed">
                ${escapeHtml(message)}
            </div>

            <button id="msg-overlay-close-btn" class="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition border border-white/10 active:scale-95">
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
    overlay.className = "absolute inset-0 bg-black/90 z-[100] flex items-center justify-center p-6 animate-fade-in backdrop-blur-sm";

    parentElement.appendChild(overlay);

    const content = `
        <div class="flex flex-col w-full max-w-sm bg-gray-900 border border-gray-700 rounded-2xl p-6 shadow-2xl transition-all duration-300 transform scale-100">
            <h2 class="text-xl font-bold text-white mb-4 flex items-center justify-center gap-2">
                <span class="text-2xl">⚠️</span>
                <span>${escapeHtml(title)}</span>
            </h2>
            
            <div class="text-gray-300 text-center mb-8 text-sm leading-relaxed">
                ${escapeHtml(message)}
            </div>

            <div class="grid grid-cols-2 gap-3">
                <button id="confirm-no-btn" class="w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-bold transition border border-gray-600 active:scale-95">
                    ${t('general.cancel')}
                </button>
                <button id="confirm-yes-btn" class="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition shadow-lg shadow-red-900/20 active:scale-95">
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
