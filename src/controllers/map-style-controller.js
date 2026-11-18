/**
 * Controls the Map Style switcher UI in Settings.
 * Handles selection, activation state, and localStorage persistence.
 */
export function initMapStyleControls(element) {
    const mapStyleBtns = element.querySelectorAll('.map-style-btn');

    const updateMapStyleUI = () => {
        const currentStyle = localStorage.getItem('map_style') || 'osm';
        mapStyleBtns.forEach(btn => {
            const isSelected = btn.dataset.style === currentStyle;
            btn.classList.toggle('is-selected', isSelected);
            btn.setAttribute('aria-pressed', String(isSelected));
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
