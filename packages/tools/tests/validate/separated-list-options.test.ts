import { describe, expect, it } from 'vitest';
import { RECORD } from '../../../common/src/record-view.ts';
import { separatedListFactoryOptions, type SlotAccessorOf } from '../../src/validate/common.ts';

const unread: SlotAccessorOf = () => {
	throw new Error('a copy is read through its storage keys');
};
const list: SlotAccessorOf = () => ({ kind: 'list', accessors: {}, delimiter: true, separator: true });

describe('separatedListFactoryOptions', () => {
	it('maps _delimiter to delimiter', () => {
		expect(separatedListFactoryOptions({ _delimiter: 0 }, unread)).toEqual({ delimiter: 0 });
	});

	it('maps _separator to separator', () => {
		expect(separatedListFactoryOptions({ _separator: 5 }, unread)).toEqual({ separator: 5 });
	});

	it('returns undefined when neither key is present', () => {
		expect(separatedListFactoryOptions({}, unread)).toBeUndefined();
	});

	it("reads a record view's delimiter through its reader", () => {
		expect(separatedListFactoryOptions({ $type: 1, [RECORD]: 8, delimiter: 2 }, list)).toEqual({ delimiter: 2 });
	});

	it("leaves out a parsed record view's separator, which is its tree's layout, not a choice", () => {
		expect(separatedListFactoryOptions({ $type: 1, [RECORD]: 8, delimiter: 2, separator: 9 }, list)).toEqual({ delimiter: 2 });
	});
});
