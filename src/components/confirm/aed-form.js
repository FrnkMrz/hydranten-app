/**
 * AED mask: the own input mask for defibrillators (AED).
 *
 * It is shown instead of the hydrant fields as soon as the person picks "AED" at the bottom of the
 * type selection. The hydrant fields (diameter, position, water source, sign) stay hidden then.
 *
 * What this file does (in simple words):
 *  1. `renderAedFormMarkup()` returns the HTML of the mask. It is placed into the confirm view template.
 *  2. `initAedForm()` makes the mask work: it reads what the person types or taps, keeps it in one
 *     small state object and shows a live summary of what would be saved ("before -> after").
 *  3. The RULES (which keys, which values, never delete) live in `services/aed-details.js`.
 *     This file only shows things and collects input.
 *
 * Operating principles (same as in the sister project AEDjaeger):
 *  - Everything is optional. "Unspecified" is always the default and writes nothing.
 *  - Large tap targets (at least 44 px).
 *  - Values that come from OpenStreetMap are untrusted text: they are only ever put into the page
 *    with `textContent` / `.value`, never as HTML.
 */

import { t } from '../../services/i18n.js';
import { escapeHTML } from '../../utils/security.js';
import {
    AED_LIMITS,
    EMPTY_AED_FORM,
    formFromExistingAedTags,
    levelLeftBehindByIndoorChange,
    planAedChanges
} from '../../services/aed-details.js';

/** Quick words for the location field. Tapping one adds the word to the text. */
const QUICK_WORDS = [
    'confirm.aed_quick_entrance',
    'confirm.aed_quick_foyer',
    'confirm.aed_quick_reception',
    'confirm.aed_quick_stairs'
];

/** Label (translation key) for every OSM key. Used for the change summary and error messages. */
const KEY_LABELS = {
    'defibrillator:location': 'confirm.aed_location_label',
    access: 'confirm.aed_access',
    opening_hours: 'confirm.aed_opening_hours',
    indoor: 'confirm.aed_indoor',
    level: 'confirm.aed_level_label',
    operator: 'confirm.aed_operator_label',
    phone: 'confirm.aed_phone_label',
    description: 'confirm.aed_description_label',
    ref: 'confirm.aed_ref_label'
};

/** Which input gets the focus when a key has a problem. */
const KEY_INPUT_IDS = {
    'defibrillator:location': 'aed-location',
    opening_hours: 'aed-hours-text',
    operator: 'aed-operator',
    phone: 'aed-phone',
    description: 'aed-description',
    ref: 'aed-ref'
};

/** Error text (translation key) per kind of problem. */
const PROBLEM_TEXTS = {
    'too-long': 'confirm.aed_error_too_long',
    'invalid-characters': 'confirm.aed_error_chars',
    'invalid-value': 'confirm.aed_error_value',
    'unknown-key': 'confirm.aed_error_value',
    empty: 'confirm.aed_error_value'
};

/**
 * Builds the HTML of one segmented choice (a row of big buttons, exactly one is selected).
 * @param {string} field - Name of the form field ('access', 'hoursMode' or 'indoor').
 * @param {string} labelId - id of the visible label (for screen readers).
 * @param {Array<{value: string, label: string}>} options - The buttons. value '' means "unspecified".
 * @param {string} columns - Tailwind grid class, e.g. 'grid-cols-2'.
 * @returns {string} HTML
 */
function segmentedMarkup(field, labelId, options, columns) {
    const buttons = options.map(option => `
        <button type="button" class="aed-seg-btn hj-seg-btn min-h-[48px] px-2 text-sm flex items-center justify-center text-center"
                data-field="${field}" data-value="${escapeHTML(option.value)}" aria-pressed="false">
            ${escapeHTML(option.label)}
        </button>`).join('');
    return `<div class="hj-seg grid ${columns} gap-1" role="group" aria-labelledby="${labelId}">${buttons}</div>`;
}

/**
 * Returns the HTML of the complete AED mask. It starts hidden (class "hidden");
 * `form.js` shows it when the AED type is selected.
 * @returns {string} HTML
 */
export function renderAedFormMarkup() {
    const unspecified = t('confirm.aed_unspecified');
    const quickChips = QUICK_WORDS.map(key => `
        <button type="button" class="aed-quick hj-pill min-h-[44px] px-3.5 text-xs font-medium text-ivory active:scale-95 transition"
                data-word="${escapeHTML(t(key))}">${escapeHTML(t(key))}</button>`).join('');

    return `
    <div id="aed-form-container" class="hidden space-y-6">

        <div class="hj-card p-4 space-y-2">
            <h3 class="hj-eyebrow text-ivory">${t('confirm.aed_details')}</h3>
            <p class="text-xs leading-relaxed text-ivory/60">${t('confirm.aed_intro')}</p>
        </div>

        <!-- Where exactly does the AED hang? -->
        <div class="aed-group space-y-2" data-key="defibrillator:location">
            <label for="aed-location" class="hj-eyebrow block">${t('confirm.aed_location_label')}</label>
            <div class="aed-controls space-y-2">
                <input type="text" id="aed-location" maxlength="${AED_LIMITS.location}" autocomplete="off"
                       placeholder="${escapeHTML(t('confirm.aed_location_placeholder'))}" class="hj-input">
                <div class="flex flex-wrap gap-2">${quickChips}</div>
            </div>
            <p class="aed-locked hidden text-xs text-ivory/70"></p>
        </div>

        <!-- Who may use it? -->
        <div class="aed-group space-y-2" data-key="access">
            <span id="aed-access-label" class="hj-eyebrow block">${t('confirm.aed_access')}</span>
            <div class="aed-controls">
                ${segmentedMarkup('access', 'aed-access-label', [
                    { value: '', label: unspecified },
                    { value: 'yes', label: t('confirm.aed_access_public') },
                    { value: 'customers', label: t('confirm.aed_access_customers') },
                    { value: 'private', label: t('confirm.aed_access_private') }
                ], 'grid-cols-2')}
            </div>
            <p class="aed-locked hidden text-xs text-ivory/70"></p>
        </div>

        <!-- When is it reachable? -->
        <div class="aed-group space-y-2" data-key="opening_hours">
            <span id="aed-hours-label" class="hj-eyebrow block">${t('confirm.aed_opening_hours')}</span>
            <div class="aed-controls space-y-2">
                ${segmentedMarkup('hoursMode', 'aed-hours-label', [
                    { value: '', label: unspecified },
                    { value: 'always', label: t('confirm.aed_hours_always') },
                    { value: 'times', label: t('confirm.aed_hours_times') }
                ], 'grid-cols-1')}
                <input type="text" id="aed-hours-text" maxlength="${AED_LIMITS.openingHours}" autocomplete="off"
                       placeholder="${escapeHTML(t('confirm.aed_opening_hours_placeholder'))}"
                       aria-label="${escapeHTML(t('confirm.aed_hours_times'))}" class="hj-input hidden">
            </div>
            <p class="aed-locked hidden text-xs text-ivory/70"></p>
        </div>

        <!-- Indoors or outdoors? (+ level, only indoors) -->
        <div class="space-y-3">
            <div class="aed-group space-y-2" data-key="indoor">
                <span id="aed-indoor-label" class="hj-eyebrow block">${t('confirm.aed_indoor')}</span>
                <div class="aed-controls">
                    ${segmentedMarkup('indoor', 'aed-indoor-label', [
                        { value: '', label: unspecified },
                        { value: 'yes', label: t('confirm.aed_indoor_yes') },
                        { value: 'no', label: t('confirm.aed_indoor_no') }
                    ], 'grid-cols-3')}
                </div>
                <p class="aed-locked hidden text-xs text-ivory/70"></p>
            </div>

            <div id="aed-level-block" class="aed-group hidden space-y-2" data-key="level">
                <span id="aed-level-label" class="hj-eyebrow block">${t('confirm.aed_level_label')}</span>
                <div class="aed-controls space-y-2">
                    <div class="flex items-center gap-2" role="group" aria-labelledby="aed-level-label">
                        <button type="button" id="aed-level-minus" class="hj-pill min-h-[48px] min-w-[48px] text-xl text-ivory"
                                aria-label="${escapeHTML(t('confirm.aed_level_minus'))}">&minus;</button>
                        <output id="aed-level-value" class="flex-1 text-center text-xl font-semibold" aria-live="polite">&ndash;</output>
                        <button type="button" id="aed-level-plus" class="hj-pill min-h-[48px] min-w-[48px] text-xl text-ivory"
                                aria-label="${escapeHTML(t('confirm.aed_level_plus'))}">+</button>
                        <button type="button" id="aed-level-clear" class="hj-pill min-h-[48px] px-3 text-xs text-ivory">${escapeHTML(unspecified)}</button>
                    </div>
                    <p class="text-xs text-ivory/60">${t('confirm.aed_level_hint')}</p>
                </div>
                <p class="aed-locked hidden text-xs text-ivory/70"></p>
            </div>
        </div>

        <!-- More details (folded) -->
        <details id="aed-more" class="hj-card p-4">
            <summary class="hj-eyebrow cursor-pointer min-h-[44px] flex items-center">${t('confirm.aed_more')}</summary>
            <div class="space-y-4 pt-3">
                <div class="aed-group" data-key="operator">
                    <label for="aed-operator" class="hj-eyebrow block mb-1.5">${t('confirm.aed_operator_label')}</label>
                    <input type="text" id="aed-operator" maxlength="${AED_LIMITS.operator}" autocomplete="off" class="aed-controls hj-input">
                    <p class="aed-locked hidden text-xs text-ivory/70"></p>
                </div>
                <div class="aed-group" data-key="phone">
                    <label for="aed-phone" class="hj-eyebrow block mb-1.5">${t('confirm.aed_phone_label')}</label>
                    <input type="tel" id="aed-phone" maxlength="${AED_LIMITS.phone}" autocomplete="off" class="aed-controls hj-input">
                    <p class="mt-1 text-xs text-ivory/60">${t('confirm.aed_phone_hint')}</p>
                    <p class="aed-locked hidden text-xs text-ivory/70"></p>
                </div>
                <div class="aed-group" data-key="description">
                    <label for="aed-description" class="hj-eyebrow block mb-1.5">${t('confirm.aed_description_label')}</label>
                    <textarea id="aed-description" maxlength="${AED_LIMITS.description}" class="aed-controls hj-input h-24 resize-none"></textarea>
                    <p class="aed-locked hidden text-xs text-ivory/70"></p>
                </div>
                <div class="aed-group" data-key="ref">
                    <label for="aed-ref" class="hj-eyebrow block mb-1.5">${t('confirm.aed_ref_label')}</label>
                    <input type="text" id="aed-ref" maxlength="${AED_LIMITS.ref}" autocomplete="off" class="aed-controls hj-input">
                    <p class="aed-locked hidden text-xs text-ivory/70"></p>
                </div>
            </div>
        </details>

        <!-- Live summary of what will be saved (before -> after) -->
        <div id="aed-changes" class="hidden hj-card p-4 space-y-2" aria-live="polite">
            <h4 class="hj-eyebrow text-ivory">${t('confirm.aed_changes_title')}</h4>
            <ul id="aed-changes-list" class="space-y-1.5 text-sm"></ul>
            <p id="aed-level-note" class="hidden text-xs text-amber-300"></p>
        </div>

        <p id="aed-error" class="hidden text-sm font-medium text-red-300" role="alert"></p>
    </div>`;
}

/**
 * Makes the AED mask work.
 *
 * @param {HTMLElement} root - The confirm view element that contains the mask.
 * @param {Object} options
 * @param {boolean} options.editMode - true when an existing object is edited.
 * @param {Object|null} options.initialData - The node being edited ({tags, ...}) or null for a new AED.
 * @param {Function} options.onChange - Called after every change (used for the "changed?" check).
 * @returns {{getPlan: Function, hasChanges: Function, showProblem: Function}|null}
 *   null if the mask is not part of the page.
 */
export function initAedForm(root, { editMode, initialData, onChange }) {
    const container = root.querySelector('#aed-form-container');
    if (!container) return null;

    // --- State -------------------------------------------------------------
    // `existing` = tags OSM has right now ({} for a new AED). `form` = what the mask shows and edits.
    const existing = (editMode && initialData && initialData.tags) ? initialData.tags : {};
    let form = { ...EMPTY_AED_FORM };
    let locked = new Set();
    if (editMode && initialData && initialData.tags) {
        const prefilled = formFromExistingAedTags(existing);
        form = prefilled.form;
        locked = prefilled.locked;
    }

    // --- Element lookups ---------------------------------------------------
    const $ = selector => container.querySelector(selector);
    const locationInput = $('#aed-location');
    const hoursInput = $('#aed-hours-text');
    const operatorInput = $('#aed-operator');
    const phoneInput = $('#aed-phone');
    const descriptionInput = $('#aed-description');
    const refInput = $('#aed-ref');
    const levelBlock = $('#aed-level-block');
    const levelValue = $('#aed-level-value');
    const moreDetails = $('#aed-more');
    const changesBox = $('#aed-changes');
    const changesList = $('#aed-changes-list');
    const levelNote = $('#aed-level-note');
    const errorLine = $('#aed-error');
    const segButtons = [...container.querySelectorAll('.aed-seg-btn')];

    /** Human readable text for an OSM value (used for locked lines and the change summary). */
    const valueLabel = (key, value) => {
        const known = {
            access: {
                yes: 'confirm.aed_access_public',
                no: 'confirm.aed_access_no',
                permissive: 'confirm.aed_access_permissive',
                customers: 'confirm.aed_access_customers',
                destination: 'confirm.aed_access_destination',
                private: 'confirm.aed_access_private'
            },
            indoor: { yes: 'confirm.aed_indoor_yes', no: 'confirm.aed_indoor_no' }
        };
        if (known[key] && known[key][value]) return t(known[key][value]);
        if (key === 'opening_hours' && value === '24/7') return t('confirm.aed_hours_always');
        return value;
    };

    /** Is the indoor answer "indoors"? The person's choice counts, otherwise the OSM value. */
    const isIndoors = () => (form.indoor !== null ? form.indoor : existing.indoor) === 'yes';

    // --- Drawing the current state into the page ---------------------------

    /** Writes the form state into the inputs (used once at the start and after changes). */
    function syncControls() {
        // Text inputs: only overwrite when different, so the cursor does not jump while typing.
        const setValue = (input, value) => { if (input && input.value !== value) input.value = value; };
        setValue(locationInput, form.location);
        setValue(hoursInput, form.hoursText);
        setValue(operatorInput, form.operator);
        setValue(phoneInput, form.phone);
        setValue(descriptionInput, form.description);
        setValue(refInput, form.ref);

        // Segmented buttons: mark the selected one.
        const current = { access: form.access, hoursMode: form.hoursMode, indoor: form.indoor };
        segButtons.forEach(btn => {
            const selected = (current[btn.dataset.field] || '') === btn.dataset.value;
            btn.classList.toggle('is-selected', selected);
            btn.setAttribute('aria-pressed', String(selected));
        });

        // The times field only shows after "specific times".
        if (hoursInput) hoursInput.classList.toggle('hidden', form.hoursMode !== 'times');

        // The level only makes sense indoors.
        if (levelBlock) levelBlock.classList.toggle('hidden', !isIndoors());
        if (levelValue) levelValue.textContent = form.level === null ? '–' : String(form.level);

        // Locked keys: hide the controls and show the existing value as plain text.
        container.querySelectorAll('.aed-group').forEach(group => {
            const key = group.dataset.key;
            const isLocked = locked.has(key);
            group.querySelectorAll('.aed-controls').forEach(controls => controls.classList.toggle('hidden', isLocked));
            const note = group.querySelector('.aed-locked');
            if (note) {
                note.classList.toggle('hidden', !isLocked);
                if (isLocked) {
                    // textContent, never innerHTML: the value comes from OpenStreetMap and is untrusted.
                    note.textContent = `${valueLabel(key, String(existing[key]))} (${t('confirm.aed_existing_value')}) – ${t('confirm.aed_locked_note')}`;
                }
            }
        });
    }

    /** Builds one line of the change summary with DOM nodes (no HTML strings). */
    function summaryLine(key, kind, before, after) {
        const item = document.createElement('li');
        item.className = 'flex flex-wrap gap-x-2 items-baseline';

        const label = document.createElement('span');
        label.className = 'text-ivory/60';
        label.textContent = t(KEY_LABELS[key]);
        item.append(label);

        if (kind === 'correction') {
            const old = document.createElement('s');
            old.className = 'text-ivory/50';
            old.textContent = valueLabel(key, before);
            const arrow = document.createElement('span');
            arrow.textContent = '→';
            arrow.setAttribute('aria-hidden', 'true');
            item.append(old, arrow);
        } else {
            const plus = document.createElement('span');
            plus.textContent = '+';
            plus.setAttribute('aria-hidden', 'true');
            item.append(plus);
        }
        const now = document.createElement('strong');
        now.textContent = valueLabel(key, after);
        item.append(now);
        return item;
    }

    /** Recomputes the plan and updates the summary, the notes and the error line. */
    function refreshSummary() {
        const plan = planAedChanges(form, existing, 'correct');
        errorLine.classList.add('hidden');
        levelNote.classList.add('hidden');
        changesList.replaceChildren();

        if (!plan.ok) {
            changesBox.classList.add('hidden');
            showProblem(plan, false);
            return plan;
        }

        // In edit mode the summary only lists real differences. For a new AED it lists everything entered.
        const lines = [];
        Object.keys(plan.additions).forEach(key => lines.push(summaryLine(key, 'addition', '', plan.additions[key])));
        plan.corrections.forEach(change => lines.push(summaryLine(change.key, 'correction', change.before, change.after)));
        lines.forEach(line => changesList.append(line));
        changesBox.classList.toggle('hidden', lines.length === 0);

        // This app never deletes a tag: warn if an old level stays although the AED is now outdoors.
        const leftBehind = editMode ? levelLeftBehindByIndoorChange(existing, plan.tags) : null;
        if (leftBehind !== null) {
            levelNote.textContent = `${t('confirm.aed_level_left_behind')} (${leftBehind})`;
            levelNote.classList.remove('hidden');
            changesBox.classList.remove('hidden');
        }
        return plan;
    }

    /**
     * Shows a problem (wrong value) next to the mask and optionally jumps to the field.
     * @param {{key: string, problem: string}} plan - The failed plan.
     * @param {boolean} [focusField=true] - Move the focus to the field (used when saving).
     */
    function showProblem(plan, focusField = true) {
        const label = KEY_LABELS[plan.key] ? t(KEY_LABELS[plan.key]) : '';
        const reason = t(PROBLEM_TEXTS[plan.problem] || 'confirm.aed_error_value');
        errorLine.textContent = label ? `${label}: ${reason}` : reason;
        errorLine.classList.remove('hidden');

        if (!focusField) return;
        const input = container.querySelector(`#${KEY_INPUT_IDS[plan.key] || 'aed-location'}`);
        if (input) {
            // Fields inside "More details" are only reachable when the fold-out is open.
            if (moreDetails && moreDetails.contains(input)) moreDetails.open = true;
            input.focus();
            if (input.scrollIntoView) input.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
    }

    /** Called after every change: redraw, recompute and tell the outside (dirty check). */
    function update() {
        syncControls();
        refreshSummary();
        if (typeof onChange === 'function') onChange();
    }

    // --- Events --------------------------------------------------------------

    // Free text inputs.
    const bindText = (input, field) => {
        if (input) input.addEventListener('input', () => { form[field] = input.value; update(); });
    };
    bindText(locationInput, 'location');
    bindText(hoursInput, 'hoursText');
    bindText(operatorInput, 'operator');
    bindText(phoneInput, 'phone');
    bindText(descriptionInput, 'description');
    bindText(refInput, 'ref');

    // Segmented buttons. An empty value means "unspecified" and is stored as null (writes nothing).
    segButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            form[btn.dataset.field] = btn.dataset.value === '' ? null : btn.dataset.value;
            update();
        });
    });

    // Quick words: add the word to the location text.
    container.querySelectorAll('.aed-quick').forEach(chip => {
        chip.addEventListener('click', () => {
            const word = chip.dataset.word || '';
            const current = form.location.trim();
            const next = current === '' ? word : `${current}, ${word}`;
            // Respect the maximum length so a tap can never create an invalid value.
            if (next.length <= AED_LIMITS.location) form.location = next;
            update();
        });
    });

    // Level stepper. From "unspecified" the first tap goes to 0 (plus) or -1 (minus).
    const stepLevel = delta => {
        let next;
        if (form.level === null) next = delta > 0 ? 0 : -1;
        else next = form.level + delta;
        form.level = Math.min(AED_LIMITS.levelMax, Math.max(AED_LIMITS.levelMin, next));
        update();
    };
    const minus = $('#aed-level-minus');
    const plus = $('#aed-level-plus');
    const clear = $('#aed-level-clear');
    if (minus) minus.addEventListener('click', () => stepLevel(-1));
    if (plus) plus.addEventListener('click', () => stepLevel(1));
    if (clear) clear.addEventListener('click', () => { form.level = null; update(); });

    // --- Start ---------------------------------------------------------------
    // In edit mode, open the fold-out right away if it already contains data.
    if (moreDetails && [form.operator, form.phone, form.description, form.ref].some(text => text.trim() !== '')) {
        moreDetails.open = true;
    }
    syncControls();
    // The first summary is empty in edit mode (nothing changed yet) and does not call onChange.
    refreshSummary();

    return {
        /** The current plan: {ok, additions, corrections, tags} or {ok: false, key, problem}. */
        getPlan: () => planAedChanges(form, existing, 'correct'),
        /**
         * Did the person change anything? (Edit mode dirty check.)
         * An INVALID entry counts as a change too: otherwise one bad field would make the whole form look
         * unchanged, the save button would silently leave the screen and all other edits would be lost.
         * With the change flag set, saving runs the validation and jumps to the field with the problem.
         */
        hasChanges: () => {
            const plan = planAedChanges(form, existing, 'correct');
            if (!plan.ok) return true;
            return Object.keys(plan.additions).length > 0 || plan.corrections.length > 0;
        },
        /** Shows the problem of a failed plan and jumps to the field. */
        showProblem: plan => showProblem(plan, true)
    };
}
