/**
 * Line icon set for the whole app.
 *
 * Every icon is drawn on the same grid with the same hairline stroke, round
 * caps and round joins so they read as one family. Icons inherit their colour
 * from `currentColor`; parts marked with `hj-icon-accent` pick up the ember
 * accent (see style.css).
 *
 * All markup here is static, so the returned strings are safe for innerHTML.
 */

const ACCENT = 'class="hj-icon-accent"';

// 24 × 24 grid, 1.5 stroke.
const UI_ICONS = {
    arrowLeft: '<path d="M19 12H5"/><path d="m11 6-6 6 6 6"/>',
    arrowRight: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
    chevronLeft: '<path d="m14.500 6-6 6 6 6"/>',
    chevronDown: '<path d="m6 9.500 6 6 6-6"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.500"/><path d="M12 7.600v.1"/>',
    user: '<circle cx="12" cy="8.500" r="3.500"/><path d="M5 20c.6-3.600 3.400-5.500 7-5.500s6.400 1.900 7 5.500"/>',
    camera: '<path d="M3.500 9a2 2 0 0 1 2-2h1.700a1 1 0 0 0 .8-.4l1-1.300a1 1 0 0 1 .8-.4h4.400a1 1 0 0 1 .8.4l1 1.300a1 1 0 0 0 .8.4h1.700a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="3.250"/>',
    cameraOff: '<path d="M8 7h-.800a1 1 0 0 0-.8.4L6 8H5.500a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2H17"/><path d="M11 5.300a1 1 0 0 1 .6-.2h2.800a1 1 0 0 1 .8.4l1 1.300a1 1 0 0 0 .8.4h1.500a2 2 0 0 1 2 2v7.300"/><path d="M9.700 11a3.250 3.250 0 0 0 4.600 4.600"/><path d="m4 4 16 16"/>',
    distance: '<path d="M3.500 7v10M20.500 7v10"/><path d="M7 12h10"/><path d="m9.500 9.500-2.500 2.500 2.500 2.500M14.500 9.500 17 12l-2.500 2.500"/>',
    pencil: '<path d="M4 20l1-4.500L16.200 4.300a1.500 1.500 0 0 1 2.100 0l1.400 1.400a1.500 1.500 0 0 1 0 2.100L8.500 19z"/><path d="m14.500 6 3.500 3.500"/>',
    cloudUp: '<path d="M7 18.500a4.500 4.500 0 0 1-.6-8.960 5.500 5.500 0 0 1 10.700-1.040 5 5 0 0 1 .4 10"/><path d="M12 20v-7.500"/><path d="m9 15 3-3 3 3"/>',
    locate: '<circle cx="12" cy="12" r="6.500"/><circle cx="12" cy="12" r="1.750" fill="currentColor" stroke="none"/><path d="M12 2.500v3M12 18.500v3M2.500 12h3M18.500 12h3"/>',
    expand: '<path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5"/>',
    collapse: '<path d="M4 9h5V4M20 9h-5V4M4 15h5v5M20 15h-5v5"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="m15.500 8.500-2 5-5 2 2-5z"/>',
    check: '<path d="m5 12.500 4.500 4.500L19 7.500"/>',
    checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8 12.300 2.800 2.800L16 9.500"/>',
    xCircle: '<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6M15 9l-6 6"/>',
    alert: '<path d="M12 4.500 20.500 19h-17z"/><path d="M12 10.500v4"/><path d="M12 16.700v.1"/>',
    question: '<circle cx="12" cy="12" r="9"/><path d="M9.700 9.500a2.400 2.400 0 1 1 3.500 2.100c-.8.5-1.200 1-1.200 1.900"/><path d="M12 16.600v.1"/>',
    trash: '<path d="M4.500 7h15"/><path d="M9.500 7V5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2"/><path d="m6.500 7 .8 11.600a1.500 1.500 0 0 0 1.500 1.400h6.400a1.500 1.500 0 0 0 1.500-1.400L17.500 7"/><path d="M10 11v5M14 11v5"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.500 2.600 3.800 5.600 3.800 9s-1.300 6.400-3.800 9c-2.500-2.600-3.800-5.600-3.800-9S9.500 5.600 12 3z"/>',
    map: '<path d="m9 5-5.500 2v12L9 17l6 2 5.500-2V5L15 7z"/><path d="M9 5v12M15 7v12"/>',
    orbit: '<circle cx="12" cy="12" r="4"/><ellipse cx="12" cy="12" rx="10" ry="3.800" transform="rotate(-28 12 12)"/>',
    mountain: '<path d="M3 19 8.500 9.500l3.500 5.500 2.200-3.200L21 19z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.500 2"/>',
    logout: '<path d="M14 4h4a1.500 1.500 0 0 1 1.500 1.500v13A1.500 1.500 0 0 1 18 20h-4"/><path d="M4 12h11"/><path d="m11 8 4 4-4 4"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-14.500-3.500L4 9"/><path d="M4 4.500V9h4.500"/><path d="M4 13a8 8 0 0 0 14.500 3.500L20 15"/><path d="M20 19.500V15h-4.500"/>',
    download: '<path d="M12 4v11"/><path d="m7.500 11 4.500 4.500 4.500-4.500"/><path d="M5 19.500h14"/>',
    external: '<path d="M14 5h5v5"/><path d="m19 5-8 8"/><path d="M18 14v4a1.500 1.500 0 0 1-1.500 1.500h-10A1.500 1.500 0 0 1 5 18V8a1.500 1.500 0 0 1 1.500-1.500h4"/>',
    pin: '<path d="M12 21s6.500-5.600 6.500-11a6.500 6.500 0 0 0-13 0c0 5.400 6.500 11 6.500 11z"/><circle cx="12" cy="10" r="2.250"/>',

    // Position of the hydrant relative to the road.
    posNone: '<circle cx="12" cy="12" r="8.500"/><path d="m6 18 12-12"/>',
    posSidewalk: '<circle cx="13" cy="4.500" r="1.750"/><path d="M12.500 8.500 9 10.500l-1 3.500"/><path d="M12.500 8.500 12 14l3 3 .5 4"/><path d="m12 14-1.500 3.500L8 21"/><path d="M12.500 8.500 15 12l3 1"/>',
    posLane: '<path d="M8 4 4.500 20M16 4l3.500 16"/><path d="M12 5v2.500M12 10.500v3M12 16.500V20"/>',
    posParking: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M10 16.500v-9h3a2.750 2.750 0 0 1 0 5.500h-3"/>',
    posGreen: '<path d="M12 21v-7"/><path d="M12 14a5.500 5.500 0 0 1-5.500-5.500C6.500 5.500 9 3 12 3s5.500 2.500 5.500 5.500A5.500 5.500 0 0 1 12 14z"/><path d="m12 11.500 2.500-2.500M12 9l-2-2"/>'
};

// 32 × 32 grid, 1.5 stroke. One ember-accented detail per icon.
const TYPE_ICONS = {
    pillar: `<path d="M11 10a5 5 0 0 1 10 0"/><path d="M16 5V3.500"/><path d="M9.500 10h13"/><path d="M11.500 10v15M20.500 10v15"/><path d="M11.500 14.500h-3v4h3M20.500 14.500h3v4h-3"/><circle cx="16" cy="16.500" r="2.250" ${ACCENT}/><path d="M8.500 25h15"/><path d="M10.500 25v3h11v-3"/>`,
    underground: `<path d="M16 3.500v6"/><path d="m13.300 7 2.700 2.700L18.700 7"/><ellipse cx="16" cy="19" rx="11.500" ry="6.500"/><ellipse cx="16" cy="19" rx="6.500" ry="3.500" ${ACCENT}/><path d="M13.700 19h4.600"/>`,
    aed: `<path d="M16 26.500S5.500 20.300 5.500 12.800A5.800 5.800 0 0 1 16 9.500a5.800 5.800 0 0 1 10.500 3.300c0 7.500-10.500 13.700-10.500 13.700z"/><path d="m17.500 11.500-4 5.500h4.500l-2.500 5" ${ACCENT}/>`,
    dry_hydrant: `<path d="M6.500 6.500v7"/><path d="M6.500 10H15a3 3 0 0 1 3 3v9"/><path d="M15.500 22h5v4h-5z"/><path d="M4 20c1.700 0 1.700-1.400 3.400-1.400S9.100 20 10.800 20s1.700-1.400 3.400-1.400M21.800 20c1.700 0 1.700-1.400 3.400-1.400S26.900 20 28 20" ${ACCENT}/>`,
    wall: `<rect x="7" y="5" width="18" height="22" rx="2.500"/><path d="M12.500 9h7"/><circle cx="16" cy="18.500" r="4.750" ${ACCENT}/><circle cx="16" cy="18.500" r="1.200"/>`,
    cistern: `<path d="M3 9.500h9M20 9.500h9"/><path d="M12.500 6.500h7"/><path d="M13.500 6.500V13M18.500 6.500V13"/><rect x="5" y="13" width="22" height="12.500" rx="6.250"/><path d="M8.500 20c1.300 0 1.300-1.200 2.600-1.200s1.300 1.200 2.600 1.200 1.300-1.200 2.600-1.200 1.300 1.200 2.600 1.200 1.300-1.200 2.600-1.200 1.300 1.200 2 1.200" ${ACCENT}/>`,
    suction_point: `<path d="M22 3.500V9a4 4 0 0 1-4 4h-1.500a3.500 3.500 0 0 0-3.500 3.500V18"/><path d="M10.700 18h4.600v3.500h-4.600z"/><path d="M3.500 24.500c2.100 0 2.100-1.600 4.200-1.600s2.100 1.600 4.200 1.600 2.100-1.600 4.200-1.600 2.100 1.600 4.200 1.600 2.100-1.600 4.200-1.600 2.100 1.600 4 1.600" ${ACCENT}/><path d="M3.500 28.500c2.100 0 2.100-1.600 4.200-1.600s2.100 1.600 4.200 1.600 2.100-1.600 4.200-1.600 2.100 1.600 4.200 1.600 2.100-1.600 4.200-1.600 2.100 1.600 4 1.600"/>`
};

function svg(body, size, className, strokeWidth) {
    return `<svg aria-hidden="true" focusable="false" class="hj-icon ${className}" viewBox="0 0 ${size} ${size}" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}

/** Returns a UI icon as an SVG string. Unknown names render nothing. */
export function icon(name, className = 'w-5 h-5') {
    const body = UI_ICONS[name];
    return body ? svg(body, 24, className, 1.5) : '';
}

/** Returns the illustration for a hydrant/AED type as an SVG string. */
export function typeIcon(name, className = 'w-9 h-9') {
    const body = TYPE_ICONS[name];
    return body ? svg(body, 32, className, 1.5) : '';
}
