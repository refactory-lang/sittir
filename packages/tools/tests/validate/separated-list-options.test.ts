import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { useRecordConstruction } from '@sittir/common/engine';
import { Delimiter, recordOf, slotValuesOf } from '@sittir/common/utils';
import rust from '../../../rust/src/index.ts';
import { separatedListFactoryOptions, type SlotAccessorOf } from '../../src/validate/common.ts';

const list: SlotAccessorOf = () => ({ kind: 'list', slots: [], accessors: {}, separator: true });
const unseparated: SlotAccessorOf = () => ({ kind: 'list', slots: [], accessors: {}, separator: false });
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

	it("reads a built record view's delimiter from the record its builder wrote", async () => {
		const records = await createEngine(rust, { nodeStorage: 'arena' });
		useRecordConstruction(records, await import('../../../rust/src/factories/records.ts'));
		const b = records.build;
		const lifetimes = b.lifetimes({ delimiter: Delimiter.Trailing }, b.lifetime(b.identifier('a')));
		expect(recordOf(lifetimes)).toBeTypeOf('number');
		expect(separatedListFactoryOptions(lifetimes as never, list)).toEqual({ delimiter: Delimiter.Trailing });
		expect(separatedListFactoryOptions(b.lifetimes(b.lifetime(b.identifier('a'))) as never, list)).toBeUndefined();
		records.dispose();
	});

	it('reads no list option from a built leaf, which is no record view', async () => {
		const records = await createEngine(rust, { nodeStorage: 'arena' });
		useRecordConstruction(records, await import('../../../rust/src/factories/records.ts'));
		const leaf = records.build.identifier('a');
		expect(recordOf(leaf)).toBeUndefined();
		expect(slotValuesOf(leaf, [])).toEqual([]);
		records.dispose();
	});
});
