import { expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import regex from '../src/index.ts';

it('an engine for a grammar with no indent unit refuses an indent option', async () => {
	await expect(createEngine(regex, { render: { layout: { indent: '\t' } } as never })).rejects.toThrow(/unknown key layout/);
});
