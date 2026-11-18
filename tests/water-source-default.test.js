import { describe, it, expect, beforeEach } from 'vitest';
import { renderConfirmView } from '../src/components/confirm/template.js';
import { initFormLogic } from '../src/components/confirm/form.js';

function mount({ editMode = false, initialData = null } = {}) {
    const element = document.createElement('div');
    element.innerHTML = renderConfirmView();
    document.body.append(element);
    initFormLogic(element, { lat: 48.1, lng: 11.5, accuracy: 5 }, editMode, initialData);
    return element;
}

const source = element => element.querySelector('#hydrant-water-source').value;
const pickType = (element, type) => element.querySelector(`.option-btn[data-value="${type}"]`).click();
const pickSource = (element, value) => {
    const select = element.querySelector('#hydrant-water-source');
    select.value = value;
    select.dispatchEvent(new Event('change'));
};

describe('water source default for new hydrants', () => {
    beforeEach(() => { document.body.innerHTML = ''; });

    it('starts a new pillar hydrant at the water main', () => {
        expect(source(mount())).toBe('main');
    });

    it('uses the water main for underground and wall hydrants', () => {
        const element = mount();
        pickType(element, 'underground');
        expect(source(element)).toBe('main');
        pickType(element, 'wall');
        expect(source(element)).toBe('main');
    });

    it('sets no source for dry hydrants, cisterns and suction points', () => {
        const element = mount();
        for (const type of ['dry_hydrant', 'cistern', 'suction_point']) {
            pickType(element, 'pillar');
            pickType(element, type);
            expect(source(element), type).toBe('');
        }
    });

    it('returns to the water main when switching back to a mains-fed type', () => {
        const element = mount();
        pickType(element, 'cistern');
        pickType(element, 'underground');
        expect(source(element)).toBe('main');
    });

    it('keeps a source the user chose by hand, including "not specified"', () => {
        const element = mount();
        pickSource(element, '');
        pickType(element, 'underground');
        expect(source(element)).toBe('');
    });

    it('does not add a source when editing a hydrant without one', () => {
        const element = mount({
            editMode: true,
            initialData: { id: 1, tags: { emergency: 'fire_hydrant', 'fire_hydrant:type': 'pillar' } }
        });
        expect(source(element)).toBe('');
    });
});
