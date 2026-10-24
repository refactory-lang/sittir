import { describe, expect, it } from 'vitest';
import { separatedListFactoryOptions } from '../../src/validate/common.ts';

describe('separatedListFactoryOptions', () => {
	it('maps _delimiter to delimiter', () => {
		expect(separatedListFactoryOptions({ _delimiter: 0 })).toEqual({ delimiter: 0 });
	});

	const withOption = { item: { propertyName: 'item', required: true, multiple: true, nonEmpty: true, separator: { default: 7 } } };

	it('maps _separator to separator for a list that has a separator option', () => {
		expect(separatedListFactoryOptions({ _separator: 5 }, withOption)).toEqual({ separator: 5 });
	});

	it('carries no separator for a list that has no separator option', () => {
		expect(separatedListFactoryOptions({ _separator: 5 })).toBeUndefined();
	});

	it('leaves out a separator that is the declared default when asked to', () => {
		expect(separatedListFactoryOptions({ _separator: 7 }, withOption, true)).toBeUndefined();
		expect(separatedListFactoryOptions({ _separator: 7 }, withOption)).toEqual({ separator: 7 });
	});

	it('returns undefined when neither key is present', () => {
		expect(separatedListFactoryOptions({})).toBeUndefined();
	});
});
