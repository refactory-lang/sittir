import { describe, expect, it } from 'vitest';
import typescript from '../src/index.ts';
import { createEngine } from '@sittir/common';

const ts = await createEngine(typescript);

describe('a boolean slot compared after a type-guard filter', () => {
	const root = ts.parse('export type * from "a";\nexport * from "b";\n');
	const guarded = () => root.$query().$descendants.filter(ts.is.exportStatementDefaultFrom);
	const ofType = () => root.$query().$descendants.ofType(ts.kinds.ExportStatementDefaultFrom);
	const count = (view: Iterable<unknown>) => [...view].length;

	it('selects what the ofType query selects, for eq(true) and eq(false)', () => {
		expect(count(ofType().where((c) => c.type.eq(true)))).toBe(1);
		expect(count(guarded().where((c) => c.type.eq(true)))).toBe(count(ofType().where((c) => c.type.eq(true))));
		expect(count(guarded().where((c) => c.type.eq(false)))).toBe(count(ofType().where((c) => c.type.eq(false))));
	});
});
