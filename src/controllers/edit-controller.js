import { auth } from '../services/auth.js';
import { fetchNodeData, updateHydrant, deleteHydrant } from '../services/osm.js';
import { renderConfirmView, initConfirmView } from '../components/confirm-view.js';
import { t } from '../services/i18n.js';

const EDIT_LOAD_TIMEOUT_MS = 15000;

function createButton(label, className, onClick) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.textContent = label;
    button.addEventListener('click', onClick);
    return button;
}

function renderLoading(app, nodeId, onCancel) {
    const container = document.createElement('section');
    container.className = 'h-full w-full bg-slate-950 text-white flex flex-col items-center justify-center gap-5 p-8 text-center animate-fade-in';
    container.setAttribute('role', 'status');
    container.setAttribute('aria-live', 'polite');

    const spinner = document.createElement('div');
    spinner.className = 'h-12 w-12 rounded-full border-4 border-blue-400 border-t-transparent animate-spin';
    spinner.setAttribute('aria-hidden', 'true');

    const heading = document.createElement('h1');
    heading.className = 'text-xl font-bold';
    heading.textContent = t('confirm.title_edit');

    const message = document.createElement('p');
    message.className = 'max-w-xs text-sm text-slate-300';
    message.textContent = t('messages.loading_hydrant').replace('{id}', nodeId);

    const cancel = createButton(
        t('confirm.cancel_btn'),
        'min-h-11 rounded-xl border border-white/15 bg-white/10 px-5 font-semibold transition hover:bg-white/15',
        onCancel
    );

    container.append(spinner, heading, message, cancel);
    app.replaceChildren(container);
}

function renderLoadError(app, nodeId, error, { onRetry, onCancel }) {
    const container = document.createElement('section');
    container.className = 'h-full w-full bg-slate-950 text-white flex flex-col items-center justify-center gap-5 p-8 text-center animate-fade-in';

    const icon = document.createElement('div');
    icon.className = 'text-5xl';
    icon.textContent = error.message === 'NODE_DELETED' ? '🗺️' : '⚠️';
    icon.setAttribute('aria-hidden', 'true');

    const heading = document.createElement('h1');
    heading.className = 'text-2xl font-bold text-amber-300';
    heading.textContent = error.message === 'NODE_DELETED' ? t('error.node_deleted') : t('error.load_failed');

    const message = document.createElement('p');
    message.className = 'max-w-sm text-sm leading-relaxed text-slate-300';
    message.textContent = error.message === 'NODE_DELETED'
        ? t('messages.edit_node_deleted_hint')
        : t('messages.edit_load_retry').replace('{id}', nodeId);

    const actions = document.createElement('div');
    actions.className = 'flex w-full max-w-sm flex-col gap-3';
    if (error.message !== 'NODE_DELETED') {
        actions.append(createButton(
            t('general.retry'),
            'min-h-12 rounded-xl bg-blue-600 px-5 font-bold transition hover:bg-blue-500 active:scale-[0.99]',
            onRetry
        ));
    }
    actions.append(createButton(
        t('error.back_to_map'),
        'min-h-12 rounded-xl border border-white/15 bg-white/10 px-5 font-semibold transition hover:bg-white/15',
        onCancel
    ));

    container.append(icon, heading, message, actions);
    app.replaceChildren(container);
}

export function handleEdit(nodeId, app, callbacks) {
    const { showSettings, showIntro } = callbacks;

    if (!auth.authenticated()) {
        import('../components/overlay.js').then(({ showMessageOverlay }) => {
            showMessageOverlay(app, t('general.error'), t('messages.please_login'), 'error', () => showSettings());
        });
        return;
    }

    let activeController = null;
    let disposed = false;
    let cleanupConfirm = null;

    const load = async () => {
        activeController?.abort();
        const controller = new AbortController();
        activeController = controller;
        let timedOut = false;
        const timeoutId = window.setTimeout(() => {
            timedOut = true;
            controller.abort();
        }, EDIT_LOAD_TIMEOUT_MS);

        renderLoading(app, nodeId, () => {
            disposed = true;
            controller.abort();
            showIntro();
        });

        try {
            const nodeData = await fetchNodeData(nodeId, { signal: controller.signal });
            if (disposed || controller.signal.aborted) return;

            app.innerHTML = renderConfirmView();
            const title = app.querySelector('#confirm-title');
            if (title) {
                title.textContent = nodeData.tags?.emergency === 'defibrillator'
                    ? t('confirm.aed_title_edit')
                    : t('confirm.title_edit');
            }

            cleanupConfirm = initConfirmView(
                app,
                null,
                { lat: nodeData.lat, lng: nodeData.lng, accuracy: 0 },
                { back: showIntro },
                data => {
                    import('../components/overlay.js').then(({ showProcessOverlay }) => {
                        showProcessOverlay(
                            app,
                            t('messages.saving_data'),
                            log => updateHydrant(data.id, data.version, data.tags, data.lat, data.lng, log),
                            { onClose: result => { if (result) showIntro(); } }
                        );
                    });
                },
                true,
                nodeData,
                (id, version) => {
                    import('../components/overlay.js').then(({ showProcessOverlay }) => {
                        showProcessOverlay(
                            app,
                            t('messages.deleting_data'),
                            log => deleteHydrant(id, version, nodeData.lat, nodeData.lng, nodeData.tags, log),
                            { onClose: result => { if (result) showIntro(); } }
                        );
                    });
                }
            );
        } catch (error) {
            if (disposed || controller.signal.aborted && !timedOut) return;
            const loadError = timedOut ? new Error('Network Timeout') : error;
            renderLoadError(app, nodeId, loadError, {
                onRetry: () => load(),
                onCancel: () => {
                    disposed = true;
                    controller.abort();
                    showIntro();
                }
            });
        } finally {
            window.clearTimeout(timeoutId);
            if (activeController === controller) activeController = null;
        }
    };

    load();
    return () => {
        disposed = true;
        activeController?.abort();
        cleanupConfirm?.();
        cleanupConfirm = null;
    };
}
