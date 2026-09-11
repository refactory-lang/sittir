import { describe, expect, it } from 'vitest';
import { separatedListFactoryOptions } from '../../src/validate/common.ts';

describe('separatedListFactoryOptions', () => {
	it('maps _delimiter to delimiter', () => {
		expect(separatedListFactoryOptions({ _delimiter: 0 })).toEqual({ delimiter: 0 });
	});

	it('maps _separator to separator', () => {
		expect(separatedListFactoryOptions({ _separator: 5 })).toEqual({ separator: 5 });
	});

	it('returns undefined when neither key is present', () => {
		expect(separatedListFactoryOptions({})).toBeUndefined();
	});
});
