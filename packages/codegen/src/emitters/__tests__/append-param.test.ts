import { describe, expect, it } from 'vitest';
import { appendParam, withTrailingParam } from '../shared.ts';

describe('appendParam', () => {
	it('joins a parameter after existing parameters with a comma', () => {
		expect(appendParam('value: V', 'options?: T.X.Options')).toBe('value: V, options?: T.X.Options');
	});

	it('takes the parameter alone when the prefix is empty, so no leading comma is emitted', () => {
		expect(appendParam('', 'options?: T.X.Options')).toBe('options?: T.X.Options');
	});
});

describe('withTrailingParam', () => {
	it('appends an options parameter to a zero-argument target without a leading comma', () => {
		const refusing = { typeParams: '', params: '' };
		expect(withTrailingParam(refusing, 'options?: T.X.Options').params).toBe('options?: T.X.Options');
	});
});
