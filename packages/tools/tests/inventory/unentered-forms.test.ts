import { describe, expect, it } from 'vitest';
import { derive } from '@sittir/codegen/bindings';
import { loadInputs } from '../../src/inventory/index.ts';

describe('forms left with no entry for their supertype\'s claim', () => {
	it('are none in any grammar', async () => {
		expect(derive(await loadInputs(['python', 'rust', 'typescript'])).unenteredForms).toEqual([]);
	}, 120_000);
});
