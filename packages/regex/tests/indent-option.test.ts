// regex's whitespace admits neither a space nor a tab, so it has no indent unit.
import { expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import regex from '../src/index.ts';

it('has no indent option', async () => {
	// @ts-expect-error no indent character is admitted
	await expect(createEngine(regex, { render: { indent: '\t' } })).rejects.toThrow(/unknown key indent/);
});
