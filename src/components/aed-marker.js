// ISO 7010 E010 AED safety sign, simplified for legibility at map-marker size.
export function renderAedMarkerSymbol() {
    return `<svg class="aed-marker-symbol" width="100%" height="100%" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
        <rect width="100" height="100" fill="#009640" />
        <path d="M50 80C44 74 18 55 18 40c0-10 7-17 17-17 7 0 12 4 15 10 3-6 9-10 16-10 10 0 17 7 17 17 0 15-27 34-33 40Z" fill="#fff" />
        <path d="m54 30-16 23h12l-5 18 19-27H52l7-14Z" fill="#009640" />
        <path d="M68 12h8v8h8v8h-8v8h-8v-8h-8v-8h8Z" fill="#fff" />
    </svg>`;
}
