import { describe, it, expect, beforeEach } from 'vitest';
import { renderConfirmView } from '../src/components/confirm/template.js';
import { initFormLogic } from '../src/components/confirm/form.js';
import { prepareHydrantTags } from '../src/services/hydrant-logic.js';

// Builds the real confirm view markup in jsdom and starts the form logic (without map, photo or network).
function mount({ editMode = false, initialData = null } = {}) {
    const element = document.createElement('div');
    element.innerHTML = renderConfirmView();
    document.body.append(element);
    const location = { lat: 48.1, lng: 11.5, accuracy: 5 };
    const logic = initFormLogic(element, location, editMode, initialData);
    return { element, logic };
}

const click = (element, selector) => element.querySelector(selector).click();
const isHidden = (element, selector) => element.querySelector(selector).classList.contains('hidden');
const typeValue = element => element.querySelector('#hydrant-type').value;

describe('AED mask: type selection', () => {
    beforeEach(() => { document.body.innerHTML = ''; });

    it('shows only the two hydrant types in the first row and the AED in its own row at the bottom', () => {
        const { element } = mount();
        const mainTypes = [...element.querySelectorAll('#type-grid-main .option-btn')].map(b => b.dataset.value);
        const secondary = [...element.querySelectorAll('#type-grid-secondary .option-btn')].map(b => b.dataset.value);
        const aedRow = [...element.querySelectorAll('#type-grid-aed .option-btn')].map(b => b.dataset.value);
        expect(mainTypes).toEqual(['pillar', 'underground']);
        expect(secondary).toEqual(['dry_hydrant', 'wall', 'cistern', 'suction_point']);
        expect(aedRow).toEqual(['aed']);
    });

    it('starts as a hydrant: hydrant fields visible, AED mask hidden', () => {
        const { element } = mount();
        expect(typeValue(element)).toBe('pillar');
        expect(isHidden(element, '#aed-form-container')).toBe(true);
        expect(isHidden(element, '#hydrant-details-container')).toBe(false);
        expect(isHidden(element, '#position-container')).toBe(false);
    });

    it('selecting AED swaps the hydrant fields for the AED mask', () => {
        const { element } = mount();
        click(element, '#type-grid-aed .option-btn');
        expect(typeValue(element)).toBe('aed');
        expect(isHidden(element, '#aed-form-container')).toBe(false);
        expect(isHidden(element, '#hydrant-details-container')).toBe(true);
        expect(isHidden(element, '#position-container')).toBe(true);
        expect(isHidden(element, '#sign-container')).toBe(true);
    });

    it('switching back to a hydrant restores the hydrant fields', () => {
        const { element } = mount();
        click(element, '#type-grid-aed .option-btn');
        click(element, '#type-grid-main .option-btn[data-value="underground"]');
        expect(isHidden(element, '#aed-form-container')).toBe(true);
        expect(isHidden(element, '#hydrant-details-container')).toBe(false);
        expect(isHidden(element, '#position-container')).toBe(false);
        expect(isHidden(element, '#sign-container')).toBe(false);
    });
});

describe('AED mask: new AED', () => {
    beforeEach(() => { document.body.innerHTML = ''; });

    it('creates an AED without details when nothing is answered', () => {
        const { element, logic } = mount();
        click(element, '#type-grid-aed .option-btn');
        const plan = logic.aedForm.getPlan();
        expect(plan.ok).toBe(true);
        expect(prepareHydrantTags({}, 'aed', '', '', '', '', '', '', 'unknown', plan.tags)).toEqual({ emergency: 'defibrillator' });
    });

    it('collects the answers into tags and shows the summary', () => {
        const { element, logic } = mount();
        click(element, '#type-grid-aed .option-btn');

        const location = element.querySelector('#aed-location');
        location.value = 'Foyer';
        location.dispatchEvent(new Event('input'));
        click(element, '.aed-seg-btn[data-field="access"][data-value="customers"]');
        click(element, '.aed-seg-btn[data-field="hoursMode"][data-value="always"]');
        click(element, '.aed-seg-btn[data-field="indoor"][data-value="yes"]');

        // the level block appears only indoors
        expect(isHidden(element, '#aed-level-block')).toBe(false);
        click(element, '#aed-level-minus');

        const plan = logic.aedForm.getPlan();
        expect(plan.tags).toEqual({
            'defibrillator:location': 'Foyer',
            access: 'customers',
            opening_hours: '24/7',
            indoor: 'yes',
            level: '-1'
        });
        expect(element.querySelectorAll('#aed-changes-list li').length).toBe(5);
        expect(isHidden(element, '#aed-changes')).toBe(false);
    });

    it('hides the level block again when "outdoors" is chosen and writes no level', () => {
        const { element, logic } = mount();
        click(element, '#type-grid-aed .option-btn');
        click(element, '.aed-seg-btn[data-field="indoor"][data-value="yes"]');
        click(element, '#aed-level-plus');
        click(element, '.aed-seg-btn[data-field="indoor"][data-value="no"]');
        expect(isHidden(element, '#aed-level-block')).toBe(true);
        expect(logic.aedForm.getPlan().tags).toEqual({ indoor: 'no' });
    });

    it('quick words extend the location text', () => {
        const { element, logic } = mount();
        click(element, '#type-grid-aed .option-btn');
        const chips = element.querySelectorAll('.aed-quick');
        expect(chips.length).toBe(4);
        chips[0].click();
        chips[1].click();
        const text = logic.aedForm.getPlan().tags['defibrillator:location'];
        expect(text).toBe(`${chips[0].dataset.word}, ${chips[1].dataset.word}`);
    });

    it('reports an invalid value and shows it in the error line', () => {
        const { element, logic } = mount();
        click(element, '#type-grid-aed .option-btn');
        element.querySelector('#aed-more').open = true;
        const phone = element.querySelector('#aed-phone');
        phone.value = 'abc';
        phone.dispatchEvent(new Event('input'));
        const plan = logic.aedForm.getPlan();
        expect(plan.ok).toBe(false);
        expect(plan.key).toBe('phone');
        expect(isHidden(element, '#aed-error')).toBe(false);
    });
});

describe('AED mask: edit existing AED', () => {
    beforeEach(() => { document.body.innerHTML = ''; });

    const node = tags => ({ id: '1', version: '3', lat: 48.1, lng: 11.5, tags });

    it('opens the AED mask prefilled and without changes', () => {
        const { element, logic } = mount({
            editMode: true,
            initialData: node({ emergency: 'defibrillator', access: 'yes', 'defibrillator:location': 'Foyer', ref: '7' })
        });
        expect(typeValue(element)).toBe('aed');
        expect(isHidden(element, '#aed-form-container')).toBe(false);
        expect(element.querySelector('#aed-location').value).toBe('Foyer');
        expect(element.querySelector('#aed-ref').value).toBe('7');
        expect(logic.aedForm.hasChanges()).toBe(false);
        expect(isHidden(element, '#aed-changes')).toBe(true);
    });

    it('shows a correction as before -> after and reports a change', () => {
        const { element, logic } = mount({
            editMode: true,
            initialData: node({ emergency: 'defibrillator', access: 'yes' })
        });
        click(element, '.aed-seg-btn[data-field="access"][data-value="private"]');
        expect(logic.aedForm.hasChanges()).toBe(true);
        const line = element.querySelector('#aed-changes-list li');
        expect(line.querySelector('s')).not.toBeNull();
        expect(line.querySelector('strong').textContent.length).toBeGreaterThan(0);
        const plan = logic.aedForm.getPlan();
        expect(plan.corrections).toEqual([{ key: 'access', before: 'yes', after: 'private' }]);
    });

    it('keeps all foreign tags and never deletes when saving', () => {
        const current = { emergency: 'defibrillator', name: 'Rathaus', access: 'yes', description: 'Notiz', 'defibrillator:code': '9999' };
        const { element, logic } = mount({ editMode: true, initialData: node(current) });
        click(element, '.aed-seg-btn[data-field="access"][data-value=""]'); // back to "unspecified"
        click(element, '.aed-seg-btn[data-field="indoor"][data-value="yes"]');
        const plan = logic.aedForm.getPlan();
        const saved = prepareHydrantTags(current, 'aed', '', '', '', '', '', '', 'unknown', plan.tags);
        expect(saved).toEqual({ ...current, indoor: 'yes' });
    });

    it('shows values the mask cannot represent as locked text and leaves them unchanged', () => {
        const { element, logic } = mount({
            editMode: true,
            initialData: node({ emergency: 'defibrillator', access: 'permissive' })
        });
        const group = element.querySelector('.aed-group[data-key="access"]');
        expect(group.querySelector('.aed-locked').classList.contains('hidden')).toBe(false);
        expect(group.querySelector('.aed-controls').classList.contains('hidden')).toBe(true);
        expect(logic.aedForm.getPlan().tags).toEqual({});
    });

    it('warns that an old level stays when the AED is switched to outdoors', () => {
        const { element } = mount({
            editMode: true,
            initialData: node({ emergency: 'defibrillator', indoor: 'yes', level: '2' })
        });
        click(element, '.aed-seg-btn[data-field="indoor"][data-value="no"]');
        expect(isHidden(element, '#aed-level-note')).toBe(false);
        expect(element.querySelector('#aed-level-note').textContent).toContain('2');
    });

    it('treats untrusted OSM text as text, never as HTML', () => {
        const evil = '<img src=x onerror="window.__pwned=1">';
        const { element } = mount({
            editMode: true,
            initialData: node({ emergency: 'defibrillator', access: evil })
        });
        expect(element.querySelector('.aed-group[data-key="access"] .aed-locked').textContent).toContain(evil);
        expect(element.querySelector('.aed-group[data-key="access"] img')).toBeNull();
        expect(window.__pwned).toBeUndefined();
    });

    it('marks a hydrant as unchanged by the AED mask (hydrant dirty check is untouched)', () => {
        const { logic } = mount({
            editMode: true,
            initialData: node({ emergency: 'fire_hydrant', 'fire_hydrant:type': 'pillar', ref: 'H1' })
        });
        expect(logic.hasChanges()).toBe(false);
    });
});
