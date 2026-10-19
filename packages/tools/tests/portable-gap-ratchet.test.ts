import { describe, expect, it } from 'vitest';
import type { PortableRows } from '@sittir/types';
import { rows as python } from '../../python/src/portable.ts';
import { rows as rust } from '../../rust/src/portable.ts';
import { rows as typescript } from '../../typescript/src/portable.ts';

const PLACED_CEILING = {
	python: { within: 6, up: 1 },
	rust: { within: 55, up: 0 },
	typescript: { within: 0, up: 0 }
};

const KEYWORD_LEAF_CEILING = { python: 8, rust: 67, typescript: 37 };

const placed = (rows: PortableRows) => {
	const entries = Object.values(rows.table.entries).flat();
	return {
		within: entries.filter((entry) => entry.within.length > 0).length,
		up: entries.flatMap((entry) => entry.test).filter((condition) => condition.up > 0).length
	};
};

const keywordLeaves = (rows: PortableRows): number =>
	Object.entries(rows.table.entries)
		.filter(([kind]) => Object.hasOwn(rows.table.fixedText, kind))
		.flatMap(([, entries]) => entries).length;

describe('read entries a node-only guard cannot answer', () => {
	it('placement-dependent entries hold at their ceiling, which only shrinks: each answers once it is restated as a kind of its own', () => {
		expect({ python: placed(python), rust: placed(rust), typescript: placed(typescript) }).toEqual(PLACED_CEILING);
	});

	it('keyword-leaf entries hold at their ceiling, which only shrinks: a fixed-text kind reads as a bare kind id until parsed units carry identity', () => {
		expect({ python: keywordLeaves(python), rust: keywordLeaves(rust), typescript: keywordLeaves(typescript) }).toEqual(KEYWORD_LEAF_CEILING);
	});
});
