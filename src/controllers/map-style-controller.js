/**
 * Controls the Map Style switcher UI in Settings.
 * Handles selection, activation state, and localStorage persistence.
 */
export function initMapStyleControls(element) {
    const mapStyleBtns = element.querySelectorAll('.map-style-btn');

    const updateMapStyleUI = () => {
        const currentStyle = localStorage.getItem('map_style') || 'osm';
        mapStyleBtns.forEach(btn => {
            if (btn.dataset.style === currentStyle) {
                btn.classList.add('bg-blue-600/30', 'border-blue-400', 'shadow-lg');
                btn.classList.remove('bg-white/5', 'border-white/10');
            } else {
                btn.classList.remove('bg-blue-600/30', 'border-blue-400', 'shadow-lg');
                btn.classList.add('bg-white/5', 'border-white/10');
            }
        });
    };

    mapStyleBtns.forEach(btn => {
        btn.onclick = () => {
            const style = btn.dataset.style;
            try {
                localStorage.setItem('map_style', style);
            } catch (e) { console.warn("Storage Full", e); }
            updateMapStyleUI();
        };
    });

    updateMapStyleUI(); // Init State
}
