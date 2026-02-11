import { describe, it, expect } from 'vitest';
import { determineHydrantType, prepareHydrantTags } from './hydrant-logic';

describe('hydrant-logic', () => {
    describe('determineHydrantType', () => {
        it('should identify cisterns', () => {
            const tags = { emergency: 'water_tank' };
            expect(determineHydrantType(tags)).toBe('cistern');
        });

        it('should identify suction points', () => {
            const tags = { emergency: 'suction_point' };
            expect(determineHydrantType(tags)).toBe('suction_point');
        });

        it('should identify dry hydrants', () => {
            const tags = { 'fire_hydrant:type': 'dry_hydrant' };
            expect(determineHydrantType(tags)).toBe('dry_hydrant');
        });

        it('should return the specific type if usually valid', () => {
            expect(determineHydrantType({ 'fire_hydrant:type': 'underground' })).toBe('underground');
            expect(determineHydrantType({ 'fire_hydrant:type': 'wall' })).toBe('wall');
        });

        it('should NOT default to pillar if type is missing (FIXED)', () => {
            const tags = { emergency: 'fire_hydrant' };
            expect(determineHydrantType(tags)).toBeUndefined();
        });

        it('should return undefined if tags are null', () => {
            expect(determineHydrantType(null)).toBeUndefined();
        });
    });

    describe('prepareHydrantTags', () => {
        it('should correctly set cistern tags', () => {
            const result = prepareHydrantTags({}, 'cistern', 'sidewalk', '', '', '', '', '100', 'unknown');
            expect(result['emergency']).toBe('water_tank');
            expect(result['water_tank:volume']).toBe('100 m3');
            expect(result['fire_hydrant:type']).toBeUndefined();
        });

        it('should NOT set type=pillar if input is empty (Correct Behavior)', () => {
            const original = { emergency: 'fire_hydrant' };
            // If UI passes empty string (no selection), it should not set type
            const result = prepareHydrantTags(original, '', 'sidewalk', '', '', '', '', '', 'unknown');
            expect(result['fire_hydrant:type']).toBeUndefined();
        });
    });
});
