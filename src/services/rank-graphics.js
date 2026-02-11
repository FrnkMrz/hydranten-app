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

    // Colors
    const RED = '#dc2626';
    const SILVER = '#d1d5db'; // Light Gray/Silver
    const GOLD = '#fbbf24';

    const addStripe = (color, index, height = stripeHeight) => {
        const y = startY - (index * (height + stripeGap));
        stripes += `<rect x="10" y="${y}" width="44" height="${height}" fill="${color}" stroke="none"/>`;
    };

    switch (rankId) {
        case 'fwa':
            // Empty / Maybe a small letter?
            stripes += `<text x="32" y="36" font-family="sans-serif" font-size="12" fill="#555" text-anchor="middle">FwA</text>`;
            break;

        // MANNSCHAFT (Red)
        case 'fm':
            addStripe(RED, 0); // 1 Red
            break;
        case 'ofm':
            addStripe(RED, 0);
            addStripe(RED, 1); // 2 Red
            break;
        case 'hfm':
            addStripe(RED, 0);
            addStripe(RED, 1);
            addStripe(RED, 2); // 3 Red
            break;

        // FÜHRUNG (Silver/Red Mix)
        // LM: 1 Silver, 2 Red (Silver is top?) No, usually standard ranks build up.
        // Bavarian Fire Brigade: 
        // LM: 1 Silver stripe
        // OLM: 1 Silver stripe + 1 Red (or similar)?
        // User Request:
        // LM: 1 SILVER 2 ROT
        // OLM: 2 SILBER 1 ROT
        // HLM: 3 SILBER

        case 'lm':
            // ORDER: Bottom to Top? Usually insignias are bottom-up or top-down. 
            // Assuming index 0 is bottom.
            // Let's stack them.
            // 1 Silver, 2 Red. 
            addStripe(SILVER, 0);
            addStripe(RED, 1);
            addStripe(RED, 2);
            break;
        case 'olm':
            // 2 Silver, 1 Red
            addStripe(SILVER, 0);
            addStripe(SILVER, 1);
            addStripe(RED, 2);
            break;
        case 'hlm':
            // 3 Silver
            addStripe(SILVER, 0);
            addStripe(SILVER, 1);
            addStripe(SILVER, 2);
            break;

        // BRANDMEISTER (Silver Broad/Thin Mixed)
        // BM: 1 Silver Broad, 2 Silver Thin (? User said: 1 Silber breit 2 silber dünn)
        // OBM: 2 silber breit 1 silber dünn
        // HBM: 3 silber breit
        case 'bm':
            // Broad at bottom? Or Top?
            // Let's put Broad at bottom (index 0)
            addStripe(SILVER, 0, 8); // Broad
            addStripe(SILVER, 1.2);   // Thin
            addStripe(SILVER, 2.2);   // Thin
            break;
        case 'obm':
            addStripe(SILVER, 0, 8); // Broad
            addStripe(SILVER, 1.2, 8); // Broad
            addStripe(SILVER, 2.4);   // Thin
            break;
        case 'hbm':
            addStripe(SILVER, 0, 8);
            addStripe(SILVER, 1.2, 8);
            addStripe(SILVER, 2.4, 8);
            break;

        // KREIS-EBENE (Gold)
        // Kommandant 10k: 1 Gold
        // KBM 25k: 2 Gold
        // KBI 50k: 3 Gold
        // KBR 100k: 4 Gold
        case 'kdt':
            addStripe(GOLD, 0, 8);
            break;
        case 'kbm':
            addStripe(GOLD, 0, 8);
            addStripe(GOLD, 1.2, 8);
            break;
        case 'kbi':
            addStripe(GOLD, 0, 8);
            addStripe(GOLD, 1.2, 8);
            addStripe(GOLD, 2.4, 8);
            break;
        case 'kbr':
            addStripe(GOLD, 0, 8);
            addStripe(GOLD, 1.2, 8);
            addStripe(GOLD, 2.4, 8);
            addStripe(GOLD, 3.6, 8);
            break;

        default:
            stripes += `<text x="32" y="36" font-family="sans-serif" font-size="20" fill="#333" text-anchor="middle">?</text>`;
    }

    // Specular Highlight ({Glass effect}) {
    const highlight = `<path d="M10 4 L54 4 L54 20 Q32 25 10 20 Z" fill="white" opacity="0.1"/>`;

    return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        ${bg}
        ${stripes}
        ${highlight}
    </svg>
    `;
}
