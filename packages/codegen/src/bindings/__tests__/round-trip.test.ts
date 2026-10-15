import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { bindingGrammars, bindingsPath, roundTripBindings } from '../index.ts';

describe('the pinned @sittir/scm round trip', () => {
	it('covers every grammar that ships a bindings.scm', () => {
		expect(bindingGrammars()).toEqual(expect.arrayContaining(['rust', 'typescript', 'python']));
	});

	for (const grammar of bindingGrammars()) {
		it(`parses ${grammar}'s bindings.scm with no error region and renders it back byte for byte`, async () => {
			const text = readFileSync(bindingsPath(grammar), 'utf8');
			const { errors, rendered } = await roundTripBindings(text);
			expect(errors).toEqual([]);
			expect(rendered).toBe(text);
		}, 120_000);
	}

	it('reports the region of a source that does not parse', async () => {
		const { errors } = await roundTripBindings('(identifier @x\n');
		expect(errors).not.toEqual([]);
	});
});
