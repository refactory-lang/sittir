import { describe, expect, it } from 'vitest';
import { OPTION_CATALOG, OPTION_INDEX, type OptionEntry } from '../src/options.ts';

const entries: readonly OptionEntry[] = OPTION_CATALOG;

describe('render options catalog', () => {
	it('is pinned', () => {
		expect(OPTION_CATALOG).toMatchSnapshot();
	});
	it('has dense indices in key order', () => {
		expect(OPTION_CATALOG.map((e) => e.index)).toEqual(OPTION_CATALOG.map((_, i) => i));
		const keys = OPTION_CATALOG.map((e) => e.key);
		expect(keys).toEqual([...keys].sort());
		expect(Object.keys(OPTION_INDEX)).toHaveLength(OPTION_CATALOG.length);
	});
	it('offers trailing only on separated lists', () => {
		for (const e of entries) {
			if (e.family !== 'list') expect(e.trailing).toBeUndefined();
		}
	});
});
