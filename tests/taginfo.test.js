import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const taginfoUrl = new URL('../public/taginfo.json', import.meta.url);

describe('Taginfo project metadata', () => {
    it('is valid project data and documents every OSM tag used by the app', async () => {
        const project = JSON.parse(await readFile(taginfoUrl, 'utf8'));

        expect(project.data_format).toBe(1);
        expect(project.data_url).toBe('https://hydrantenjaeger.de/taginfo.json');
        expect(project.project).toMatchObject({
            name: 'Hydranten Jäger',
            project_url: 'https://hydrantenjaeger.de',
            contact_name: 'Hydranten Jäger',
            contact_email: 'info@openfiremap.org'
        });
        expect(project.tags).toEqual(expect.arrayContaining([
            { key: 'emergency', value: 'fire_hydrant', object_types: ['node'], description: expect.any(String) },
            { key: 'emergency', value: 'suction_point', object_types: ['node'], description: expect.any(String) },
            { key: 'emergency', value: 'water_tank', object_types: ['node'], description: expect.any(String) },
            ...[
                'fire_hydrant:type',
                'fire_hydrant:position',
                'fire_hydrant:diameter',
                'fire_hydrant:diameter:signed',
                'water_source',
                'water_tank:volume',
                'ref',
                'ref:signed',
                'note',
                'description'
            ].map(key => expect.objectContaining({ key, object_types: ['node'], description: expect.any(String) }))
        ]));
    });
});
