export const Log = {
    init: () => {
        if (!document.getElementById('debug-log')) {
            const div = document.createElement('div');
            div.id = 'debug-log';
            div.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100px; background:rgba(0,0,0,0.7); color:#0f0; font-family:monospace; font-size:10px; overflow-y:auto; z-index:9999; pointer-events:none; padding:4px;";
            document.body.appendChild(div);
        }
    },
    add: (msg) => {
        const el = document.getElementById('debug-log');
        if (el) {
            const line = document.createElement('div');
            line.innerText = `[${new Date().toLocaleTimeString()}] ${msg}`;
            el.prepend(line);
            // Keep only last 10
            if (el.children.length > 10) el.lastChild.remove();
        }
        console.log('[DEBUG]', msg);
    }
};
