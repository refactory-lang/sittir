import { describe, expect, it } from 'vitest';
import { allGrammars } from '@sittir/codegen/grammars';
import { admittingSlots } from '../src/scripts/required-slot-census.ts';

describe.each(allGrammars())('%s: a required, option-free, unfilled slot rejects undefined', (grammar) => {
	it('the strict config requires it', async () => {
		expect((await admittingSlots(grammar, false)).strict).toEqual([]);
	}, 240000);
});
