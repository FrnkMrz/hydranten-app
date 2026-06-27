/**
 * Determines the internal app type ID based on OSM tags.
 * @param {Object} tags - The OSM tags object.
 * @returns {string} The internal type ID (e.g., 'pillar', 'underground', 'cistern').
 */
export function determineHydrantType(tags) {
    if (!tags) return undefined;

    if (tags['emergency'] === 'water_tank') return 'cistern';
    if (tags['emergency'] === 'suction_point') return 'suction_point';
    if (tags['fire_hydrant:type'] === 'dry_hydrant') return 'dry_hydrant';

    // Return the type if it exists. DO NOT default to 'pillar' for unknown types.
    // This allows the UI to show "no selection" instead of forcing a type.
    return tags['fire_hydrant:type'];
}

/**
 * Prepares the OSM tags object based on the UI state.
 * @param {Object} currentTags - The original tags (for merging).
 * @param {string} selectedType - The selected type ID.
 * @param {string} selectedPos - The selected position.
 * @param {string} diameter - The diameter value.
 * @param {string} ref - The reference number.
 * @param {string} note - The note content.
 * @param {string} waterSource - The water source value.
 * @param {string} volume - The volume (for cisterns).
 * @param {string} sign - The sign state ('yes', 'no', 'unknown').
 * @returns {Object} The new tags object.
 */
export function prepareHydrantTags(currentTags, selectedType, selectedPos, diameter, ref, note, waterSource, volume, sign) {
    const tags = { ...currentTags };

    // Remove every tag controlled by this form before rebuilding the selected
    // hydrant type. This allows users to clear values and prevents hidden fields
    // from leaking tags that do not belong to the selected object type.
    [
        'emergency',
        'fire_hydrant:type',
        'fire_hydrant:position',
        'fire_hydrant:diameter',
        'fire_hydrant:diameter:signed',
        'ref',
        'ref:signed',
        'note',
        'description',
        'water_source',
        'water_tank:volume'
    ].forEach(key => delete tags[key]);

    if (selectedPos) tags['fire_hydrant:position'] = selectedPos;
    if (note?.trim()) tags['note'] = note.trim();
    if (waterSource) tags['water_source'] = waterSource;

    // Handle specific types
    if (selectedType === 'cistern') {
        tags['emergency'] = 'water_tank';

        if (volume?.trim()) {
            let val = volume.trim();
            if (/^\d+$/.test(val)) val += " m3";
            tags['water_tank:volume'] = val;
        }
        if (ref?.trim()) tags['ref'] = ref.trim();
    }
    else if (selectedType === 'dry_hydrant') {
        tags['emergency'] = 'fire_hydrant';
        tags['fire_hydrant:type'] = 'dry_hydrant';
        if (diameter?.trim()) tags['fire_hydrant:diameter'] = diameter.trim();
        if (ref?.trim()) tags['ref'] = ref.trim();
    }
    else if (selectedType === 'suction_point') {
        tags['emergency'] = 'suction_point';
    }
    else {
        // Standard Hydrants (pillar, underground, wall, or unknown/new)
        tags['emergency'] = 'fire_hydrant';

        if (selectedType) tags['fire_hydrant:type'] = selectedType;
        if (diameter?.trim()) tags['fire_hydrant:diameter'] = diameter.trim();
        if (ref?.trim()) tags['ref'] = ref.trim();

        // Sign Logic
        if (selectedType === 'underground') {
            if (sign === 'no') {
                tags['fire_hydrant:diameter:signed'] = 'no';
                tags['ref:signed'] = 'no';
            } else if (sign === 'yes') {
                tags['fire_hydrant:diameter:signed'] = 'yes';
                if (tags['ref:signed'] === 'no') delete tags['ref:signed'];
            } else {
                delete tags['fire_hydrant:diameter:signed'];
                delete tags['ref:signed'];
            }
        }
    }

    return tags;
}
