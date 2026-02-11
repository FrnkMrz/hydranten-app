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

    // Handle specific types
    if (selectedType === 'cistern') {
        tags['emergency'] = 'water_tank';
        delete tags['fire_hydrant:type'];

        if (volume) {
            let val = volume.trim();
            if (/^\d+$/.test(val)) val += " m3";
            tags['water_tank:volume'] = val;
        }
        tags['fire_hydrant:position'] = selectedPos;
    }
    else if (selectedType === 'dry_hydrant') {
        tags['emergency'] = 'fire_hydrant';
        tags['fire_hydrant:type'] = 'dry_hydrant';
        tags['fire_hydrant:position'] = selectedPos;
        delete tags['water_tank:volume'];
    }
    else if (selectedType === 'suction_point') {
        tags['emergency'] = 'suction_point';
        tags['fire_hydrant:position'] = selectedPos;
        delete tags['fire_hydrant:type'];
        delete tags['water_tank:volume'];
        delete tags['ref'];
        delete tags['fire_hydrant:diameter'];
    }
    else {
        // Standard Hydrants (pillar, underground, wall, or unknown/new)
        tags['emergency'] = 'fire_hydrant';

        // BUG FIX (Proposed): Only set fire_hydrant:type if selectedType is a valid known type or explicitly set.
        // Ideally, if selectedType is empty/unknown, we shouldn't set it to 'pillar' unless the user actively chose 'pillar'.
        // But for now, we replicate the EXISTING behavior to demonstrate the bug in tests.
        if (selectedType) {
            tags['fire_hydrant:type'] = selectedType;
        } else {
            // If no type selected, existing logic deleted it?
            delete tags['fire_hydrant:type'];
        }

        tags['fire_hydrant:position'] = selectedPos;
        delete tags['water_tank:volume'];

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

    // Common Fields
    if (diameter) tags['fire_hydrant:diameter'] = diameter;
    if (ref) tags['ref'] = ref;
    if (note) tags['note'] = note;

    // Water Source
    if (waterSource) {
        tags['water_source'] = waterSource;
    } else if (currentTags && currentTags['water_source']) {
        // If explicitly cleared (assuming waterSource passed as empty string means 'clear'), 
        // BUT we need to be careful. In the UI, empty value means "default" or "no change"?
        // The previous logic deleted it if it existed.
        delete tags['water_source'];
    }

    return tags;
}
