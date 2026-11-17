/**
 * Determines the internal app type ID based on OSM tags.
 * @param {Object} tags - The OSM tags object.
 * @returns {string} The internal type ID (e.g., 'pillar', 'underground', 'cistern').
 */
export function determineHydrantType(tags) {
    if (!tags) return undefined;

    if (tags['emergency'] === 'defibrillator') return 'aed';
    if (tags['emergency'] === 'water_tank') return 'cistern';
    if (tags['emergency'] === 'suction_point') return 'suction_point';
    if (tags['fire_hydrant:type'] === 'dry_hydrant') return 'dry_hydrant';

    // Return the type if it exists. DO NOT default to 'pillar' for unknown types.
    // This allows the UI to show "no selection" instead of forcing a type.
    return tags['fire_hydrant:type'];
}

/**
 * Every tag the hydrant form controls. When a hydrant is rebuilt (or an object changes its type),
 * these keys are removed first and then set again from the form.
 */
const HYDRANT_FORM_KEYS = [
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
];

/**
 * Builds the tags for an AED.
 *
 * - Existing AED: ALL existing tags stay. Only the planned additions and corrections are applied.
 *   Nothing is deleted, so an unknown or empty field never removes data from OpenStreetMap.
 * - Object that was something else (for example a hydrant) and becomes an AED: the hydrant form keys
 *   are removed first, because they do not belong to an AED.
 *
 * @param {Object} currentTags - The tags the object has now ({} for a new AED).
 * @param {Object} aedTags - The checked AED detail tags to write (from planAedChanges).
 * @returns {Object} The new tags object.
 */
function prepareAedTags(currentTags, aedTags) {
    const tags = { ...currentTags };
    if (currentTags?.emergency !== 'defibrillator') {
        HYDRANT_FORM_KEYS.forEach(key => delete tags[key]);
    }
    tags['emergency'] = 'defibrillator';
    Object.assign(tags, aedTags);
    return tags;
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
 * @param {Object} [aedTags] - Only for type 'aed': the already checked AED detail tags that
 *   should be written (result of planAedChanges().tags in aed-details.js).
 * @returns {Object} The new tags object.
 */
export function prepareHydrantTags(currentTags, selectedType, selectedPos, diameter, ref, note, waterSource, volume, sign, aedTags = {}) {
    // AEDs have their own mask and their own rules. They never run through the hydrant code below,
    // so nothing about the hydrant tags can change by accident.
    if (selectedType === 'aed') return prepareAedTags(currentTags, aedTags);

    const tags = { ...currentTags };

    // Remove every tag controlled by this form before rebuilding the selected
    // hydrant type. This allows users to clear values and prevents hidden fields
    // from leaking tags that do not belong to the selected object type.
    HYDRANT_FORM_KEYS.forEach(key => delete tags[key]);

    if (note?.trim()) tags['note'] = note.trim();

    if (currentTags?.emergency === 'defibrillator') {
        delete tags['access'];
        delete tags['indoor'];
        delete tags['opening_hours'];
    }

    if (selectedPos) tags['fire_hydrant:position'] = selectedPos;
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
