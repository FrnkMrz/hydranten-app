import { auth } from '../services/auth.js';
import { t } from '../services/i18n.js';

export function handleAuthCallback(locationSearch, locationHash, app, callbacks) {
    const { showSettings, showIntro } = callbacks;

    if (locationSearch.includes('code=')) {
        const params = new URLSearchParams(locationSearch);
        const code = params.get('code');
        if (code) {
            const state = params.get('state');
            console.log("PKCE Auth Callback detected!");

            // Authorization codes are short-lived credentials. Remove them from
            // the address bar before any asynchronous token exchange begins.
            window.history.replaceState({}, document.title, window.location.pathname);

            // Loading
            app.innerHTML = '';
            const container = document.createElement('div');
            container.className = "hj-screen absolute inset-0 flex flex-col items-center justify-center animate-fade-in";

            const spinner = document.createElement('div');
            spinner.className = "hj-spinner w-9 h-9 mb-6";

            const title = document.createElement('h2');
            title.className = "hj-wordmark text-[2.2rem] text-center px-6";
            title.textContent = t('messages.verifying_login');

            const logContainer = document.createElement('div');
            logContainer.className = "text-left max-w-sm w-full px-6 mt-4";

            const logDiv = document.createElement('div');
            logDiv.id = "pkce-log";
            logDiv.className = "custom-scrollbar text-xs leading-relaxed font-mono text-ivory/60 border border-ivory/10 p-4 rounded-2xl h-32 overflow-auto";
            logDiv.textContent = "INIT...";

            logContainer.appendChild(logDiv);
            container.append(spinner, title, logContainer);
            app.appendChild(container);

            const log = (msg) => {
                const line = document.createElement('div');
                line.textContent = "> " + msg;
                logDiv.appendChild(line);
                logDiv.scrollTop = logDiv.scrollHeight;
            };

            log(t('messages.verifying_login'));

            auth.exchangeCode(code, state)
                .then(() => {
                    // The token is persisted by the auth service. Never put it in UI logs.
                    log(t('general.success'));
                    setTimeout(() => {
                        showSettings();
                    }, 1000);
                })
                .catch(err => {
                    console.error("PKCE Error:", err);
                    log("ERROR: " + err.message);

                    const div = document.createElement('div');
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.onclick = () => {
                        showIntro();
                    };
                    btn.className = "hj-btn hj-btn-light w-full mt-4";
                    btn.textContent = t('messages.back_to_start');
                    div.appendChild(btn);

                    app.querySelector('.text-left').appendChild(div);
                });
        } else {
            showIntro();
        }
    } else {
        // Clear Hash if present from prev attempts
        if (locationHash.includes('access_token=')) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }
        showIntro();
    }
}
