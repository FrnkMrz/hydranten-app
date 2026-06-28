import { t } from './i18n.js';

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

function createUpdateBanner(onUpdate) {
    const banner = document.createElement('aside');
    banner.id = 'app-update-banner';
    banner.className = 'fixed left-1/2 bottom-safe-6 z-[1000] flex w-[calc(100%-2rem)] max-w-[448px] -translate-x-1/2 items-center gap-3 rounded-2xl border border-blue-400/30 bg-gray-900/95 p-4 text-white shadow-2xl backdrop-blur-md';
    banner.setAttribute('role', 'status');
    banner.setAttribute('aria-live', 'polite');

    const message = document.createElement('p');
    message.className = 'min-w-0 flex-1 text-sm font-medium';
    message.textContent = t('pwa.update_available');

    const updateButton = document.createElement('button');
    updateButton.id = 'app-update-btn';
    updateButton.className = 'shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold transition hover:bg-blue-500 disabled:opacity-60';
    updateButton.type = 'button';
    updateButton.textContent = t('pwa.update_now');
    updateButton.addEventListener('click', async () => {
        updateButton.disabled = true;
        updateButton.textContent = t('general.loading');

        try {
            await onUpdate();
        } catch (error) {
            console.error('App update failed:', error);
            updateButton.disabled = false;
            updateButton.textContent = t('general.retry');
        }
    });

    const dismissButton = document.createElement('button');
    dismissButton.className = 'shrink-0 rounded-lg px-2 py-1 text-2xl leading-none text-gray-400 transition hover:text-white';
    dismissButton.type = 'button';
    dismissButton.setAttribute('aria-label', t('general.close'));
    dismissButton.textContent = '×';
    dismissButton.addEventListener('click', () => banner.remove());

    banner.append(message, updateButton, dismissButton);
    return banner;
}

export function initPwaUpdates(registerServiceWorker) {
    if (typeof registerServiceWorker !== 'function') return () => {};

    let registration = null;
    let updateServiceWorker = () => Promise.resolve();
    let updateInterval = null;

    const showUpdateBanner = () => {
        if (document.getElementById('app-update-banner')) return;

        const banner = createUpdateBanner(() => updateServiceWorker(true));
        document.body.appendChild(banner);
    };

    const checkForUpdate = () => {
        if (!registration || document.hidden || !navigator.onLine) return;
        registration.update().catch(error => {
            console.warn('Service worker update check failed:', error);
        });
    };

    const handleVisibilityChange = () => {
        if (!document.hidden) checkForUpdate();
    };

    updateServiceWorker = registerServiceWorker({
        immediate: true,
        onNeedRefresh: showUpdateBanner,
        onRegisteredSW(_serviceWorkerUrl, serviceWorkerRegistration) {
            registration = serviceWorkerRegistration;
            checkForUpdate();
            updateInterval = window.setInterval(checkForUpdate, UPDATE_CHECK_INTERVAL_MS);
        },
        onRegisterError(error) {
            console.error('Service worker registration failed:', error);
        }
    });

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', checkForUpdate);

    return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('online', checkForUpdate);
        if (updateInterval !== null) window.clearInterval(updateInterval);
        document.getElementById('app-update-banner')?.remove();
    };
}
