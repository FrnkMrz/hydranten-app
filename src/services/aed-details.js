/**
 * AED details: the rules for the extra data of a defibrillator (AED).
 *
 * This file contains ONLY pure functions: no network, no storage, no DOM.
 * That makes it easy to test (see tests/aed-details.test.js) and easy to read.
 *
 * The rules are a port of the data contract of the sister project "AEDjaeger"
 * (src/contracts/aedDetails.ts). Keep both in sync when one of them changes.
 *
 * Safety rules (they protect real OpenStreetMap data, because this app writes directly to OSM):
 *  1. Only the keys in AED_DETAIL_KEYS can ever be written. Everything else is rejected.
 *  2. "Unknown" (empty field, nothing selected) NEVER creates a tag and NEVER deletes one.
 *  3. Tags are never deleted by this module. A cleared field simply changes nothing.
 *  4. `defibrillator:code` (an access code that could open a lock) is never collected.
 *  5. `opening_hours=24/7` only exists if the person explicitly chose "around the clock".
 *  6. `level` is only written if the device is indoors.
 *
 * Terms used below:
 *  - "form"      = what the person typed or selected (see EMPTY_AED_FORM for the shape).
 *  - "existing"  = the tags the object already has in OpenStreetMap (empty for a new AED).
 *  - "addition"  = a key that is missing in OSM and gets a value now.
 *  - "correction"= a key that already has a value in OSM and gets a different one now.
 */

/**
 * The ONLY OSM keys the AED mask may write. The order is also the order of the change summary.
 * Deliberately NOT included: `defibrillator:code`, `defibrillator:cabinet`, `name`,
 * `manufacturer`, `model` and every other key.
 */
export const AED_DETAIL_KEYS = [
    'defibrillator:location',
    'access',
    'opening_hours',
    'indoor',
    'level',
    'operator',
    'phone',
    'description',
    'ref'
];

/**
 * Maximum text lengths. OSM allows 255 characters per value; short fields stay well below
 * so the entries remain readable. Counted with `string.length` (an emoji counts twice, which
 * is the stricter side and can never produce a value that is too long for OSM).
 */
export const AED_LIMITS = {
    location: 160,
    openingHours: 120,
    operator: 120,
    phone: 40,
    description: 255,
    ref: 60,
    levelMin: -9,
    levelMax: 99
};

/** Who may use the device? ("no" and "permissive" exist in OSM, but the mask does not offer them.) */
export const AED_ACCESS_VALUES = ['yes', 'customers', 'private'];

/** Is the device inside a building? */
export const AED_INDOOR_VALUES = ['yes', 'no'];

/**
 * An empty form: nothing is answered, so no tag is created.
 * `hoursMode` is "always" (24/7), "times" (text in `hoursText`) or null (unknown).
 * `level` is a whole number (0 = ground floor, -1 = basement) or null (unknown).
 */
export const EMPTY_AED_FORM = Object.freeze({
    location: '',
    access: null,
    hoursMode: null,
    hoursText: '',
    indoor: null,
    level: null,
    operator: '',
    phone: '',
    description: '',
    ref: ''
});

/**
 * Characters that do not belong into free text:
 *  - control characters (line break, tab, ...),
 *  - invisible characters (zero width, byte order mark),
 *  - characters that flip the writing direction (they could be used to visually swap text).
 */
// The control characters are exactly what this pattern is meant to find, so the lint rule is switched off here.
// eslint-disable-next-line no-control-regex
const FORBIDDEN_TEXT_CHARACTERS = /[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2066-\u2069\ufeff]/u;

/** Phone number: digits, spaces, + ( ) - / . and ; for several numbers. */
const PHONE_PATTERN = /^[+0-9][0-9 ()+\-/.;]*$/u;

/** Level as text: a whole number without a leading zero, e.g. "0", "-1", "12". */
const LEVEL_PATTERN = /^(0|-?[1-9]\d?)$/u;

/** Length limit per key for the pure free-text fields. */
const TEXT_LIMIT = {
    'defibrillator:location': AED_LIMITS.location,
    opening_hours: AED_LIMITS.openingHours,
    operator: AED_LIMITS.operator,
    phone: AED_LIMITS.phone,
    description: AED_LIMITS.description,
    ref: AED_LIMITS.ref
};

/** Safe "does this object have this own key?" check (works in every browser). */
function hasOwn(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
}

/**
 * Is `key` one of the allowed AED detail keys?
 * @param {string} key
 * @returns {boolean}
 */
export function isAedDetailKey(key) {
    return AED_DETAIL_KEYS.includes(key);
}

/**
 * Checks ONE already trimmed value against the rules of its key.
 * @param {string} key - One of AED_DETAIL_KEYS.
 * @param {string} value - The trimmed value.
 * @returns {string|null} null if the value is fine, otherwise the reason:
 *   'empty' | 'too-long' | 'invalid-characters' | 'invalid-value' | 'unknown-key'
 */
function checkValue(key, value) {
    if (value.length === 0) return 'empty';

    // Selection fields: only exactly the offered values.
    if (key === 'access') return AED_ACCESS_VALUES.includes(value) ? null : 'invalid-value';
    if (key === 'indoor') return AED_INDOOR_VALUES.includes(value) ? null : 'invalid-value';
    if (key === 'level') {
        if (!LEVEL_PATTERN.test(value)) return 'invalid-value';
        const number = Number(value);
        return number >= AED_LIMITS.levelMin && number <= AED_LIMITS.levelMax ? null : 'invalid-value';
    }

    // From here on only free texts: first the length, then the characters.
    const limit = TEXT_LIMIT[key];
    if (limit === undefined) return 'unknown-key'; // safety net, should never happen
    if (value.length > limit) return 'too-long';
    if (FORBIDDEN_TEXT_CHARACTERS.test(value)) return 'invalid-characters';

    // A phone number additionally needs a fixed pattern and at least three digits (e.g. "112").
    if (key === 'phone') {
        if (!PHONE_PATTERN.test(value)) return 'invalid-characters';
        if ((value.match(/\d/gu) || []).length < 3) return 'invalid-value';
    }
    return null;
}

/** Sorts tags into the fixed order of AED_DETAIL_KEYS (keeps summary and tests stable). */
function inDetailOrder(tags) {
    const ordered = {};
    for (const key of AED_DETAIL_KEYS) {
        if (tags[key] !== undefined) ordered[key] = tags[key];
    }
    return ordered;
}

/**
 * Validates a set of tags before anything is written to OpenStreetMap.
 *
 * - Every key must be in AED_DETAIL_KEYS. One foreign key rejects EVERYTHING (nothing can be smuggled in).
 * - Every value must be a string and valid after trimming.
 * - Nothing is silently dropped: a bad value returns an error so the person can fix it.
 *
 * @param {Object} input - Tags to check (key -> text).
 * @returns {{ok: true, tags: Object} | {ok: false, key: string, problem: string}}
 */
export function validateAedTags(input) {
    if (typeof input !== 'object' || input === null || Array.isArray(input)) {
        return { ok: false, key: '', problem: 'invalid-value' };
    }
    const entries = Object.entries(input);

    // Step 1: look at all keys before any value is looked at.
    for (const [key] of entries) {
        if (!isAedDetailKey(key)) return { ok: false, key, problem: 'unknown-key' };
    }

    // Step 2: check every value and take it over trimmed.
    const cleaned = {};
    for (const [key, rawValue] of entries) {
        if (typeof rawValue !== 'string') return { ok: false, key, problem: 'invalid-value' };
        const value = rawValue.trim();
        const problem = checkValue(key, value);
        if (problem) return { ok: false, key, problem };
        cleaned[key] = value;
    }
    return { ok: true, tags: inDetailOrder(cleaned) };
}

/**
 * Turns the form into candidate tags WITHOUT validating them.
 * Only non-empty, trimmed answers become tags ("unknown" creates nothing).
 *
 * @param {Object} form - The current form state (see EMPTY_AED_FORM).
 * @param {Object} [existing] - Existing OSM tags. If OSM already says `indoor=yes` and the person did not
 *   touch the indoor question, the level is still allowed.
 * @returns {Object} Candidate tags (key -> text).
 */
function collectFormTags(form, existing) {
    const candidate = {};

    // Helper: take a text over if something is left after trimming.
    const addText = (key, value) => {
        const trimmed = (value || '').trim();
        if (trimmed.length > 0) candidate[key] = trimmed;
    };

    addText('defibrillator:location', form.location);
    if (form.access !== null && form.access !== undefined) candidate.access = form.access;

    // 24/7 only after an explicit choice. "Specific times" without typed times creates no tag.
    if (form.hoursMode === 'always') candidate.opening_hours = '24/7';
    else if (form.hoursMode === 'times') addText('opening_hours', form.hoursText);

    if (form.indoor !== null && form.indoor !== undefined) candidate.indoor = form.indoor;

    // A level only belongs to a device inside a building. The person's choice counts; without a choice
    // the existing OSM value counts.
    const effectiveIndoor = (form.indoor !== null && form.indoor !== undefined)
        ? form.indoor
        : (existing && existing.indoor) || null;
    if (effectiveIndoor === 'yes' && form.level !== null && form.level !== undefined) {
        candidate.level = String(form.level);
    }

    addText('operator', form.operator);
    addText('phone', form.phone);
    addText('description', form.description);
    addText('ref', form.ref);
    return candidate;
}

/**
 * Plans what would be written into a (new or existing) AED: compares the form with the tags OSM has.
 *
 * Rules:
 *  - Key missing in OSM + value in the form  -> ADDITION.
 *  - Key exists in OSM + a different value   -> CORRECTION (only in mode 'correct').
 *  - Same value after trimming               -> no change.
 *  - Nothing is ever deleted: an empty field or "unknown" changes nothing.
 *  - Only values that would really be written are validated. An unchanged but unusual value that is
 *    already in OSM (for example a very long phone number) never blocks saving other details.
 *
 * @param {Object} form - The form state.
 * @param {Object} existing - Existing OSM tags ({} for a new AED).
 * @param {'add-only'|'correct'} [mode='correct'] - 'add-only' ignores keys that already exist.
 * @returns {{ok: true, additions: Object, corrections: Array, tags: Object}
 *   | {ok: false, key: string, problem: string}}
 *   `corrections` is a list of {key, before, after}; `tags` holds additions and corrections together.
 */
export function planAedChanges(form, existing, mode = 'correct') {
    const known = existing || {};
    const candidate = collectFormTags(form, known);
    const wanted = {};
    const before = {};

    for (const key of AED_DETAIL_KEYS) {
        const value = candidate[key];
        if (value === undefined) continue;
        const old = hasOwn(known, key) ? String(known[key]) : undefined;
        if (old === undefined) {
            wanted[key] = value; // addition
        } else if (mode === 'correct' && value !== old.trim()) {
            wanted[key] = value; // correction
            before[key] = old;
        }
        // Otherwise: blocked (add-only) or unchanged. Nothing to write.
    }

    const checked = validateAedTags(wanted);
    if (!checked.ok) return checked;

    const additions = {};
    const corrections = [];
    for (const key of AED_DETAIL_KEYS) {
        const after = checked.tags[key];
        if (after === undefined) continue;
        if (hasOwn(before, key)) corrections.push({ key, before: before[key], after });
        else additions[key] = after;
    }
    return { ok: true, additions, corrections, tags: checked.tags };
}

/**
 * Fills the form from the tags an existing AED already has, and names the keys the form CANNOT show
 * (for example `access=permissive` or a note that is too long). Such values stay locked and unchanged;
 * the mask only shows them as text.
 *
 * @param {Object} existing - Existing OSM tags.
 * @returns {{form: Object, locked: Set<string>}}
 */
export function formFromExistingAedTags(existing) {
    const form = { ...EMPTY_AED_FORM };
    const locked = new Set();
    const source = existing || {};
    // Is this value valid for this key? (Reuses the same rules as saving.)
    const valid = (key, value) => validateAedTags({ [key]: value }).ok;

    for (const key of AED_DETAIL_KEYS) {
        if (!hasOwn(source, key)) continue;
        const value = String(source[key]).trim();
        let representable = false;

        switch (key) {
            case 'defibrillator:location':
                if (valid(key, value)) { form.location = value; representable = true; }
                break;
            case 'access':
                if (AED_ACCESS_VALUES.includes(value)) { form.access = value; representable = true; }
                break;
            case 'opening_hours':
                if (value === '24/7') {
                    form.hoursMode = 'always';
                    representable = true;
                } else if (valid(key, value)) {
                    form.hoursMode = 'times';
                    form.hoursText = value;
                    representable = true;
                }
                break;
            case 'indoor':
                if (AED_INDOOR_VALUES.includes(value)) { form.indoor = value; representable = true; }
                break;
            case 'level':
                if (valid(key, value)) { form.level = Number(value); representable = true; }
                break;
            case 'operator':
            case 'phone':
            case 'description':
            case 'ref':
                if (valid(key, value)) { form[key] = value; representable = true; }
                break;
            default:
                break;
        }
        if (!representable) locked.add(key);
    }
    return { form, locked };
}

/**
 * Detects: "the person sets `indoor` to outdoors, but OSM still has a level".
 * This app never deletes a tag, so the old level would stay. The mask says so honestly before saving.
 *
 * @param {Object} existing - Existing OSM tags.
 * @param {Object} tags - The tags that would be written (additions and corrections).
 * @returns {string|null} The old level value that stays, otherwise null.
 */
export function levelLeftBehindByIndoorChange(existing, tags) {
    if (tags.indoor !== 'no') return null; // only if "outdoors" is written now
    if (tags.level !== undefined) return null; // a new level would be shown anyway
    const source = existing || {};
    const old = hasOwn(source, 'level') ? String(source.level).trim() : '';
    return old === '' ? null : old;
}
