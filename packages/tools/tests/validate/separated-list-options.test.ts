import { describe, expect, it } from 'vitest';
import { RECORD } from '../../../common/src/record-view.ts';
import { separatedListFactoryOptions, type SlotAccessorOf } from '../../src/validate/common.ts';

const list: SlotAccessorOf = () => ({ kind: 'list', accessors: {}, delimiter: true, separator: true });
const unseparated: SlotAccessorOf = () => ({ kind: 'list', accessors: {}, delimiter: true, separator: false });
const withOption = { item: { propertyName: 'item', required: true, multiple: true, nonEmpty: true, separator: { default: 7 } } };

describe('separatedListFactoryOptions', () => {
	it('maps _delimiter to delimiter', () => {
		expect(separatedListFactoryOptions({ $type: 1, _delimiter: 0 }, list)).toEqual({ delimiter: 0 });
	});

	it('maps _separator to separator for a list that has a separator option', () => {
		expect(separatedListFactoryOptions({ $type: 1, _separator: 5 }, list, withOption)).toEqual({ separator: 5 });
	});

	it('carries no separator for a list that has no separator option', () => {
		expect(separatedListFactoryOptions({ $type: 1, _separator: 5 }, list)).toBeUndefined();
	});

	it('carries no separator for a kind whose separator is not chosen per instance', () => {
		expect(separatedListFactoryOptions({ $type: 1, _separator: 5 }, unseparated, withOption)).toBeUndefined();
	});

	it('leaves out a separator that is the declared default when asked to', () => {
		expect(separatedListFactoryOptions({ $type: 1, _separator: 7 }, list, withOption, true)).toBeUndefined();
		expect(separatedListFactoryOptions({ $type: 1, _separator: 7 }, list, withOption)).toEqual({ separator: 7 });
	});

	it('returns undefined when neither key is present', () => {
		expect(separatedListFactoryOptions({ $type: 1 }, list)).toBeUndefined();
	});

	it("reads a record view's delimiter through its reader", () => {
		expect(separatedListFactoryOptions({ $type: 1, [RECORD]: 8, delimiter: 2 }, list)).toEqual({ delimiter: 2 });
	});
});
