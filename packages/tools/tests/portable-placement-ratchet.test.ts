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

const placed = (rows: PortableRows) => {
	const entries = Object.values(rows.table.entries).flat();
	return {
		within: entries.filter((entry) => entry.within.length > 0).length,
		up: entries.flatMap((entry) => entry.test).filter((condition) => condition.up > 0).length
	};
};

describe('placement-dependent read entries', () => {
	it('hold at their ceiling, which only shrinks: each answers once it is restated as a kind of its own', () => {
		expect({ python: placed(python), rust: placed(rust), typescript: placed(typescript) }).toEqual(PLACED_CEILING);
	});
});
