// regex's whitespace admits neither a space nor a tab, so it has no indent unit.
import { expect, it } from 'vitest';
import { createEngine } from '../src/index.ts';

it('has no indent option', () => {
	// @ts-expect-error no indent character is admitted
	expect(() => createEngine({ options: { indent: '\t' } })).toThrow(/unknown key indent/);
});
