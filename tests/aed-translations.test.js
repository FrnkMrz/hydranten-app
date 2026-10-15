import { describe, expect, it } from 'vitest';
import ar from '../src/locales/ar.js';
import cs from '../src/locales/cs.js';
import de from '../src/locales/de.js';
import en from '../src/locales/en.js';
import es from '../src/locales/es.js';
import fr from '../src/locales/fr.js';
import hr from '../src/locales/hr.js';
import itLocale from '../src/locales/it.js';
import ja from '../src/locales/ja.js';
import ko from '../src/locales/ko.js';
import nl from '../src/locales/nl.js';
import pl from '../src/locales/pl.js';
import pt from '../src/locales/pt.js';
import tr from '../src/locales/tr.js';
import zh from '../src/locales/zh.js';

const locales = { ar, cs, de, en, es, fr, hr, it: itLocale, ja, ko, nl, pl, pt, tr, zh };
const aedStrings = [
    'aed_marker_aria',
    'aed_title_edit',
    'aed_details',
    'aed_access',
    'aed_unspecified',
    'aed_access_public',
    'aed_access_no',
    'aed_access_permissive',
    'aed_access_customers',
    'aed_access_destination',
    'aed_access_private',
    'aed_existing_value',
    'aed_indoor',
    'aed_opening_hours',
    'aed_opening_hours_placeholder',
    'aed_ref_label',
    'delete_confirm_aed'
];

describe('AED translations', () => {
    it('includes all AED UI strings in every supported language', () => {
        for (const [language, locale] of Object.entries(locales)) {
            for (const key of aedStrings) {
                expect(locale.confirm[key], `${language}: confirm.${key}`).toBeTruthy();
            }
            expect(locale.confirm.types.aed, `${language}: confirm.types.aed`).toBeTruthy();
        }
    });
});
