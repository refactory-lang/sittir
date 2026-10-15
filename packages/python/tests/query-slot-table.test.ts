import { expect, it } from 'vitest';
import python from '../src/index.ts';
import { hooks } from '../src/api.ts';
import { createEngine } from '@sittir/common';

const py = await createEngine(python);

it('the query slot table stamps a keyword-presence slot with its keyword, and only that slot', () => {
	const row = hooks.querySlots[py.kinds.FunctionDefinition]!;
	expect(row.find(([accessor]) => accessor === 'async')).toEqual(['async', expect.any(Number), 'async']);
	expect(row.find(([accessor]) => accessor === 'name')).toEqual(['name', expect.any(Number)]);
	expect(new Set(row.map(([, slot]) => slot)).size).toBe(row.length);
});
