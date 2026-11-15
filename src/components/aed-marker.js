// ISO 7010 E010 AED safety sign, simplified for legibility at map-marker size.
// The heart stays clear of the upper-right medical cross at small sizes.
export function renderAedMarkerSymbol() {
    return `<svg class="aed-marker-symbol" width="100%" height="100%" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
        <rect width="100" height="100" fill="#009640" />
        <path data-symbol="heart" d="M40 82C34 75 12 58 12 43c0-11 7-17 16-17 6 0 10 4 12 9 3-5 7-9 13-9 7 0 12 6 12 17 0 15-20 32-28 39Z" fill="#fff" />
        <path data-symbol="lightning" d="m42 34-15 23h12l-5 18 19-27H40l7-14Z" fill="#009640" />
        <path data-symbol="medical-cross" d="M78 12h8v8h8v8h-8v8h-8v-8h-8v-8h8Z" fill="#fff" />
    </svg>`;
}
