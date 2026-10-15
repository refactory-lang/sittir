import { describe, expect, it } from 'vitest';
import { derive } from '@sittir/codegen/bindings';
import { loadInputs } from '../../src/inventory/index.ts';

const CEILING: readonly string[] = [];

describe('required members a wildcard-claimed kind has no route for', () => {
	it('are exactly the recorded ones: a new one is a regression, a fixed one leaves the list', async () => {
		const d = derive(await loadInputs(['python', 'rust', 'typescript']));
		expect(d.wildcardUnrouted).toEqual(CEILING);
	}, 120_000);
});
