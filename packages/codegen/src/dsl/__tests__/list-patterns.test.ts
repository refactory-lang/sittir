import { describe, it, expect } from 'vitest';
import { detectRepeatSeparator } from '../list-patterns.ts';

describe('detectRepeatSeparator preserves a choice-shaped separator', () => {
	it('returns the full CHOICE rule, not just its first string arm', () => {
		const seq = {
			type: 'SEQ',
			members: [
				{ type: 'CHOICE', members: [{ type: 'STRING', value: ',' }, { type: 'STRING', value: ';' }] },
				{ type: 'SYMBOL', name: 'item' }
			]
		};
		const result = detectRepeatSeparator(seq);
		expect(result).not.toBeNull();
		expect(result!.separator).toEqual({
			type: 'CHOICE',
			members: [{ type: 'STRING', value: ',' }, { type: 'STRING', value: ';' }]
		});
	});

	it('still returns a bare STRING separator for the plain-literal case (unchanged)', () => {
		const seq = { type: 'SEQ', members: [{ type: 'STRING', value: ',' }, { type: 'SYMBOL', name: 'item' }] };
		const result = detectRepeatSeparator(seq);
		expect(result!.separator).toEqual({ type: 'STRING', value: ',' });
	});

	it('preserves trailing when the separator comes second', () => {
		const seq = { type: 'SEQ', members: [{ type: 'SYMBOL', name: 'item' }, { type: 'STRING', value: ',' }] };
		const result = detectRepeatSeparator(seq);
		expect(result!.trailing).toBe(true);
		expect(result!.separator).toEqual({ type: 'STRING', value: ',' });
	});
});
