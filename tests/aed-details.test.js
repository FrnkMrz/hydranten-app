import { describe, it, expect } from 'vitest';
import {
    AED_DETAIL_KEYS,
    EMPTY_AED_FORM,
    formFromExistingAedTags,
    levelLeftBehindByIndoorChange,
    planAedChanges,
    validateAedTags
} from '../src/services/aed-details.js';

// Helper: a form with some answers filled in (everything else stays "unspecified").
const form = (changes = {}) => ({ ...EMPTY_AED_FORM, ...changes });

describe('aed-details: validateAedTags', () => {
    it('accepts valid tags and trims the values', () => {
        const result = validateAedTags({ 'defibrillator:location': '  Eingang  ', access: 'yes' });
        expect(result).toEqual({ ok: true, tags: { 'defibrillator:location': 'Eingang', access: 'yes' } });
    });

    it('rejects ALL tags if one key is not on the list (nothing can be smuggled in)', () => {
        const result = validateAedTags({ access: 'yes', 'defibrillator:code': '1234' });
        expect(result).toEqual({ ok: false, key: 'defibrillator:code', problem: 'unknown-key' });
    });

    it('never allows the cabinet key or the access code', () => {
        expect(AED_DETAIL_KEYS).not.toContain('defibrillator:code');
        expect(AED_DETAIL_KEYS).not.toContain('defibrillator:cabinet');
    });

    it('rejects values that are not offered in the selection', () => {
        expect(validateAedTags({ access: 'permissive' }).problem).toBe('invalid-value');
        expect(validateAedTags({ indoor: 'maybe' }).problem).toBe('invalid-value');
        expect(validateAedTags({ level: '1.5' }).problem).toBe('invalid-value');
        expect(validateAedTags({ level: '100' }).problem).toBe('invalid-value');
        expect(validateAedTags({ level: '-10' }).problem).toBe('invalid-value');
    });

    it('accepts levels from -9 to 99', () => {
        expect(validateAedTags({ level: '-1' }).ok).toBe(true);
        expect(validateAedTags({ level: '0' }).ok).toBe(true);
        expect(validateAedTags({ level: '99' }).ok).toBe(true);
    });

    it('rejects too long texts and hidden or control characters', () => {
        expect(validateAedTags({ ref: 'x'.repeat(61) }).problem).toBe('too-long');
        expect(validateAedTags({ description: 'Zeile 1\nZeile 2' }).problem).toBe('invalid-characters');
        expect(validateAedTags({ operator: 'Firma​X' }).problem).toBe('invalid-characters');
        expect(validateAedTags({ operator: 'Firma‮X' }).problem).toBe('invalid-characters');
    });

    it('checks phone numbers', () => {
        expect(validateAedTags({ phone: '+49 911 1234-5' }).ok).toBe(true);
        expect(validateAedTags({ phone: 'anruf mich' }).problem).toBe('invalid-characters');
        expect(validateAedTags({ phone: '+4' }).problem).toBe('invalid-value');
    });

    it('rejects values that are not text', () => {
        expect(validateAedTags({ access: 5 }).problem).toBe('invalid-value');
        expect(validateAedTags(null).ok).toBe(false);
        expect(validateAedTags([]).ok).toBe(false);
    });
});

describe('aed-details: planAedChanges for a NEW AED', () => {
    it('writes nothing for an empty form ("unspecified" creates no tag)', () => {
        const plan = planAedChanges(form(), {});
        expect(plan.ok).toBe(true);
        expect(plan.tags).toEqual({});
    });

    it('turns the answers into tags in the fixed order', () => {
        const plan = planAedChanges(form({
            ref: 'A-1',
            access: 'customers',
            location: 'Foyer',
            indoor: 'yes',
            level: -1,
            hoursMode: 'times',
            hoursText: 'Mo-Fr 08:00-18:00'
        }), {});
        expect(plan.ok).toBe(true);
        expect(Object.keys(plan.tags)).toEqual(['defibrillator:location', 'access', 'opening_hours', 'indoor', 'level', 'ref']);
        expect(plan.tags.level).toBe('-1');
    });

    it('writes 24/7 only after the explicit choice "around the clock"', () => {
        expect(planAedChanges(form({ hoursMode: 'always' }), {}).tags.opening_hours).toBe('24/7');
        expect(planAedChanges(form({ hoursMode: null }), {}).tags.opening_hours).toBeUndefined();
        // "specific times" without typed times creates no tag
        expect(planAedChanges(form({ hoursMode: 'times', hoursText: '  ' }), {}).tags.opening_hours).toBeUndefined();
    });

    it('writes the level only for AEDs indoors', () => {
        expect(planAedChanges(form({ indoor: 'no', level: 2 }), {}).tags.level).toBeUndefined();
        expect(planAedChanges(form({ indoor: null, level: 2 }), {}).tags.level).toBeUndefined();
        expect(planAedChanges(form({ indoor: 'yes', level: 2 }), {}).tags.level).toBe('2');
    });

    it('returns the problem instead of silently dropping a bad value', () => {
        const plan = planAedChanges(form({ phone: 'abc' }), {});
        expect(plan.ok).toBe(false);
        expect(plan.key).toBe('phone');
    });
});

describe('aed-details: planAedChanges for an EXISTING AED', () => {
    const existing = { emergency: 'defibrillator', access: 'yes', ref: 'OLD', name: 'Rathaus' };

    it('plans additions and corrections separately', () => {
        const plan = planAedChanges(form({ access: 'private', ref: 'OLD', location: 'Foyer' }), existing, 'correct');
        expect(plan.ok).toBe(true);
        expect(plan.additions).toEqual({ 'defibrillator:location': 'Foyer' });
        expect(plan.corrections).toEqual([{ key: 'access', before: 'yes', after: 'private' }]);
    });

    it('does not list unchanged values', () => {
        const plan = planAedChanges(form({ access: 'yes', ref: 'OLD' }), existing, 'correct');
        expect(plan.tags).toEqual({});
    });

    it('never deletes: an empty field or "unspecified" changes nothing', () => {
        const plan = planAedChanges(form({ access: null, ref: '' }), existing, 'correct');
        expect(plan.tags).toEqual({});
    });

    it('ignores existing keys in add-only mode', () => {
        const plan = planAedChanges(form({ access: 'private', location: 'Foyer' }), existing, 'add-only');
        expect(plan.tags).toEqual({ 'defibrillator:location': 'Foyer' });
    });

    it('allows a level when OSM already says indoor=yes', () => {
        const plan = planAedChanges(form({ level: 1 }), { ...existing, indoor: 'yes' }, 'correct');
        expect(plan.tags.level).toBe('1');
    });

    it('an unusual unchanged value from OSM does not block saving other details', () => {
        const longPhone = '+49 ' + '1'.repeat(60);
        const plan = planAedChanges(form({ location: 'Foyer' }), { ...existing, phone: longPhone }, 'correct');
        expect(plan.ok).toBe(true);
        expect(plan.tags).toEqual({ 'defibrillator:location': 'Foyer' });
    });
});

describe('aed-details: formFromExistingAedTags', () => {
    it('fills the form from existing tags', () => {
        const { form: filled, locked } = formFromExistingAedTags({
            access: 'customers',
            opening_hours: '24/7',
            indoor: 'yes',
            level: '-1',
            'defibrillator:location': 'Foyer',
            ref: '7'
        });
        expect(filled).toMatchObject({ access: 'customers', hoursMode: 'always', indoor: 'yes', level: -1, location: 'Foyer', ref: '7' });
        expect(locked.size).toBe(0);
    });

    it('locks values the form cannot show (they stay unchanged)', () => {
        const { form: filled, locked } = formFromExistingAedTags({ access: 'permissive', indoor: 'maybe' });
        expect(locked.has('access')).toBe(true);
        expect(locked.has('indoor')).toBe(true);
        expect(filled.access).toBeNull();
        // locked keys produce no tags, so nothing is overwritten
        expect(planAedChanges(filled, { access: 'permissive', indoor: 'maybe' }, 'correct').tags).toEqual({});
    });

    it('shows other opening hours as "specific times"', () => {
        const { form: filled } = formFromExistingAedTags({ opening_hours: 'Mo-Fr 08:00-18:00' });
        expect(filled.hoursMode).toBe('times');
        expect(filled.hoursText).toBe('Mo-Fr 08:00-18:00');
    });
});

describe('aed-details: levelLeftBehindByIndoorChange', () => {
    it('warns when outdoors is written but an old level stays', () => {
        expect(levelLeftBehindByIndoorChange({ level: '2' }, { indoor: 'no' })).toBe('2');
    });

    it('stays silent in all other cases', () => {
        expect(levelLeftBehindByIndoorChange({ level: '2' }, { indoor: 'yes' })).toBeNull();
        expect(levelLeftBehindByIndoorChange({}, { indoor: 'no' })).toBeNull();
        expect(levelLeftBehindByIndoorChange({ level: '2' }, { indoor: 'no', level: '3' })).toBeNull();
    });
});
