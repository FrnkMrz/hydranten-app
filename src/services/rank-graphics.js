/**
 * Generates SVG Rank Insignia for Bavarian Fire Brigade
 * "Schulterklappen" Style
 */

export function getRankBadgeSVG(rankId) {
    const width = 64;
    const height = 64;

    // Background: Dark Blue / Black Shield/Rect
    // Using a rounded rect for the "Schulterklappe" look
    const bg = `<rect x="10" y="4" width="44" height="56" rx="4" fill="#1a1a2e" stroke="#333" stroke-width="2"/>`; // Dark Blue-ish Black

    // Stripe Config
    const stripeHeight = 6;
    const stripeGap = 4;
    const startY = 48; // Bottom up

    let stripes = '';

    const addStripe = (color, index) => {
        const y = startY - (index * (stripeHeight + stripeGap));
        stripes += `<rect x="10" y="${y}" width="44" height="${stripeHeight}" fill="${color}" stroke="none"/>`;
    };

    switch (rankId) {
        case 'fwa':
            // Empty / Maybe a small letter?
            stripes += `<text x="32" y="36" font-family="sans-serif" font-size="12" fill="#555" text-anchor="middle">FwA</text>`;
            break;

        // MANNSCHAFT (Red)
        case 'fm':
            addStripe('#dc2626', 0); // 1 Red
            break;
        case 'ofm':
            addStripe('#dc2626', 0);
            addStripe('#dc2626', 1); // 2 Red
            break;
        case 'hfm':
            addStripe('#dc2626', 0);
            addStripe('#dc2626', 1);
            addStripe('#dc2626', 2); // 3 Red
            break;

        // FÜHRUNG (Silver) -> Löschmeister
        case 'lm':
            addStripe('#c0c0c0', 0); // 1 Silver
            break;
        case 'olm':
            addStripe('#c0c0c0', 0);
            addStripe('#c0c0c0', 1); // 2 Silver
            break;
        case 'hlm':
            addStripe('#c0c0c0', 0);
            addStripe('#c0c0c0', 1);
            addStripe('#c0c0c0', 2); // 3 Silver
            break;

        // FÜHRUNG (Gold) -> Brandmeister
        case 'bm':
            addStripe('#fbbf24', 0); // 1 Gold
            break;
        case 'obm':
            addStripe('#fbbf24', 0);
            addStripe('#fbbf24', 1); // 2 Gold
            break;
        case 'hbm':
            addStripe('#fbbf24', 0);
            addStripe('#fbbf24', 1);
            addStripe('#fbbf24', 2); // 3 Gold
            break;

        // KREISBRANDRAT (Special)
        case 'kbr':
            // Gold Frame + Wreath/Star mock
            // Thick gold box
            stripes += `<rect x="14" y="8" width="36" height="48" fill="none" stroke="#fbbf24" stroke-width="4"/>`;
            stripes += `<circle cx="32" cy="32" r="8" fill="#fbbf24"/>`;
            break;

        default:
            stripes += `<text x="32" y="36" font-family="sans-serif" font-size="20" fill="#333" text-anchor="middle">?</text>`;
    }

    // Specular Highlight (Glass effect)
    const highlight = `<path d="M10 4 L54 4 L54 20 Q32 25 10 20 Z" fill="white" opacity="0.1"/>`;

    return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        ${bg}
        ${stripes}
        ${highlight}
    </svg>
    `;
}
