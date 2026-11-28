import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { recordOf } from '@sittir/common/utils';
import rust from '../src/index.ts';

type ReadArena = { readSide(key: number, side: 'leading' | 'trailing' | 'inner'): unknown[] };

const arenaOf = (root: unknown): ReadArena => (root as { $tree: { built: ReadArena } }).$tree.built;
const first = (root: any, kind: number): any => root.$query().$descendants.ofType(kind).at(0);

describe("a read node's sides, read from its records", () => {
	it('names a comment its parse placed by its node, its span and its kind', async () => {
		using rs: any = await createEngine(rust, { nodeStorage: 'arena' });
		const root = rs.parse('// only\n');
		expect(arenaOf(root).readSide(recordOf(root)!, 'inner')).toEqual([{ $node: expect.any(Number), $span: { start: 0, end: 7 }, $type: rust.kinds.LineComment }]);
	});

	it('names an ERROR its parse placed by its kind and its source text, between the gap kinds its record keeps', async () => {
		using rs: any = await createEngine(rust, { nodeStorage: 'arena' });
		const root = rs.parse('fn f() { § }\n');
		const inner = arenaOf(root).readSide(recordOf(first(root, rust.kinds.Block))!, 'inner');
		expect(inner).toHaveLength(3);
		expect(inner[1]).toEqual({ $type: 65535, $text: '§' });
		expect(inner[0]).toBe(inner[2]);
		expect(typeof inner[0]).toBe('number');
	});

	it('reads a written side as written, and leaves the other side as its parse placed it', async () => {
		using rs: any = await createEngine(rust, { nodeStorage: 'arena' });
		const root = rs.parse('fn f() {\n    g(a,  b); // tail\n}\n');
		const statement = first(root, rust.kinds.ExpressionStatement);
		const arena = arenaOf(root);
		const trailing = arena.readSide(recordOf(statement)!, 'trailing');
		expect(trailing).toEqual([{ $node: expect.any(Number), $span: { start: 23, end: 30 }, $type: rust.kinds.LineComment }]);
		expect(arena.readSide(recordOf(statement)!, 'leading')).toEqual([]);
		using comment = rs.build.lineComment(' w');
		statement.$trivia.leading(comment);
		expect(arena.readSide(recordOf(statement)!, 'leading')).toEqual([{ $type: rust.kinds.LineComment, $record: expect.any(Number) }]);
		expect(arena.readSide(recordOf(statement)!, 'trailing')).toEqual(trailing);
		expect(String(root.$render())).toBe('fn f() {\n    // w\n    g(a,  b); // tail\n}\n');
	});
});
