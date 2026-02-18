import { auth } from '../services/auth.js';
import { t } from '../services/i18n.js';

export function handleAuthCallback(locationSearch, locationHash, app, callbacks) {
    const { showSettings, showIntro } = callbacks;

    if (locationSearch.includes('code=')) {
        const params = new URLSearchParams(locationSearch);
        const code = params.get('code');
        if (code) {
            console.log("PKCE Auth Callback detected!");

            // Loading
            app.innerHTML = '';
            const container = document.createElement('div');
            container.className = "absolute inset-0 bg-slate-900 flex flex-col items-center justify-center text-white animate-fade-in";

            const spinner = document.createElement('div');
            spinner.className = "w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4";

            const title = document.createElement('h2');
            title.className = "text-xl font-bold";
            title.textContent = t('messages.verifying_login');

            const logContainer = document.createElement('div');
            logContainer.className = "text-left max-w-sm w-full px-6 mt-4";

            const logDiv = document.createElement('div');
            logDiv.id = "pkce-log";
            logDiv.className = "text-xs font-mono text-green-400 bg-black/40 p-3 rounded h-32 overflow-auto";
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

            log("Got Code: " + code.substring(0, 5) + "...");

            // Debug Verifier in Storage
            const verifier = localStorage.getItem('osm_pkce_verifier');
            log("Verifier in Storage: " + (verifier ? "YES (" + verifier.length + " chars)" : "NO (!!!)"));

            auth.exchangeCode(code)
                .then(accessToken => {
                    log("SUCCESS! Token: " + accessToken.substring(0, 10) + "...");
                    log("Redirecting...");
                    setTimeout(() => {
                        window.history.replaceState({}, document.title, window.location.pathname);
                        showSettings();
                    }, 1000);
                })
                .catch(err => {
                    console.error("PKCE Error:", err);
                    log("ERROR: " + err.message);

                    const div = document.createElement('div');
                    // Note: using innerHTML for button string is safe here as contents are static text
                    div.innerHTML = `<button onclick="window.location.href='/'" class="w-full mt-4 py-3 bg-red-600 hover:bg-red-700 rounded-xl font-bold">${t('messages.back_to_start')}</button>`;
                    const btn = div.querySelector('button');
                    btn.onclick = () => {
                        window.history.replaceState({}, document.title, window.location.pathname);
                        showIntro();
                    };
                    // Clear innerHTML usage above by creating element manually
                    div.innerHTML = '';
                    btn.className = "w-full mt-4 py-3 bg-red-600 hover:bg-red-700 rounded-xl font-bold";
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
