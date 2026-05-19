import { describe, expect, it } from 'vitest';

import { chooseEffectiveKindForSpan } from '../validate/read-render-parse.ts';

describe('read-render-parse span kind selection', () => {
	it('keeps the first visible kind on same-span visible collisions', () => {
		expect(chooseEffectiveKindForSpan('program', 'try_statement')).toBe('program');
	});

	it('lets a hidden alias-source kind replace an existing visible kind', () => {
		expect(chooseEffectiveKindForSpan('type_identifier', '_type_identifier')).toBe('_type_identifier');
	});

	it('keeps an existing hidden alias-source kind when a later visible kind arrives', () => {
		expect(chooseEffectiveKindForSpan('_type_identifier', 'type_identifier')).toBe('_type_identifier');
	});
});
