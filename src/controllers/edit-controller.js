import { auth } from '../services/auth.js';
import { fetchNodeData, updateHydrant, deleteHydrant } from '../services/osm.js';
import { renderConfirmView, initConfirmView } from '../components/confirm-view.js';
import { t } from '../services/i18n.js';

function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

export function handleEdit(nodeId, app, callbacks) {
    const { showSettings, showIntro } = callbacks;

    if (!auth.authenticated()) {
        import('../components/overlay.js').then(({ showMessageOverlay }) => {
            showMessageOverlay(app, t('general.error'), t('messages.please_login'), 'error', () => showSettings());
        });
        return;
    }

    console.log("Edit Mode requested for Node:", nodeId);

    // Simple Loading Visual
    app.innerHTML = '';
    const container = document.createElement('div');
    container.className = "h-full w-full bg-black flex flex-col items-center justify-center text-white space-y-4";

    const spinner = document.createElement('div');
    spinner.className = "w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin";

    const msg = document.createElement('p');
    msg.className = "font-bold";
    msg.textContent = t('messages.loading_hydrant').replace('{id}', nodeId);

    container.append(spinner, msg);
    app.appendChild(container);

    // Safety check (Imports should be available)
    if (!fetchNodeData) console.error("Missing fetchNodeData import");
    if (!deleteHydrant) console.error("Missing deleteHydrant import");

    fetchNodeData(nodeId)
        .then(nodeData => {
            // console.log("Loaded Node Data:", nodeData);
            // Switch to Confirm View in Edit Mode
            app.innerHTML = renderConfirmView();

            // Init Confirm View with Edit Mode = true
            initConfirmView(
                app,
                null, // No Photo Blob
                { lat: nodeData.lat, lng: nodeData.lng, accuracy: 0 }, // Location
                { back: () => { showIntro(); } }, // OnBack (Cancel) -> Intro
                (data) => {
                    // OnSubmit (Save)
                    import('../components/overlay.js').then(({ showProcessOverlay }) => {
                        showProcessOverlay(
                            app,
                            t('messages.saving_data'),
                            (log) => updateHydrant(data.id, data.version, data.tags, data.lat, data.lng, log),
                            { onClose: () => showIntro() }
                        );
                    });
                },
                true, // editMode
                nodeData, // initialData
                (id, version) => {
                    // OnDelete
                    if (deleteHydrant) {
                        import('../components/overlay.js').then(({ showProcessOverlay }) => {
                            showProcessOverlay(
                                app,
                                t('messages.deleting_data'),
                                (log) => deleteHydrant(id, version, nodeData.lat, nodeData.lng, nodeData.tags, log),
                                { onClose: () => showIntro() }
                            );
                        });
                    } else {
                        import('../components/overlay.js').then(({ showMessageOverlay }) => {
                            showMessageOverlay(app, t('general.error'), t('messages.internal_error_reload'), 'error');
                        });
                        console.error("deleteHydrant missing");
                    }
                }
            );
        })
        .catch(err => {
            console.error("Load Failed:", err);
            // ... (Error handling code remains same)
            let msg = t('error.load_failed') + ": " + err.message;
            let autoClose = false;

            if (err.message === "NODE_DELETED") {
                msg = t('error.node_deleted');
                autoClose = true;
            }

            // Update Loading Screen with Error
            app.innerHTML = '';
            const container = document.createElement('div');
            container.className = "h-full w-full bg-black flex flex-col items-center justify-center text-white space-y-6 p-8 text-center animate-fade-in";

            const icon = document.createElement('div');
            icon.className = "text-6xl";
            icon.textContent = "⚠️";

            const title = document.createElement('h2');
            title.className = "text-2xl font-bold text-red-500";
            title.textContent = t('error.oops');

            const message = document.createElement('p');
            message.className = "text-lg text-gray-300";
            message.textContent = msg;

            const btnContainer = document.createElement('div');
            btnContainer.className = "w-full max-w-xs mt-4";

            const btn = document.createElement('button');
            btn.id = "error-back-btn";
            btn.className = "w-full py-4 bg-gray-800 hover:bg-gray-700 rounded-xl font-bold transition";
            btn.textContent = t('error.back_to_map');

            btnContainer.appendChild(btn);
            container.append(icon, title, message, btnContainer);
            app.appendChild(container);

            document.getElementById('error-back-btn').onclick = () => showIntro();

            if (autoClose) {
                setTimeout(() => showIntro(), 2500);
            }
        });
}
