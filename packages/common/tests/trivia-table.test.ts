import { describe, expect, it } from 'vitest';
import rust from '@sittir/rust';
import { createEngine } from '@sittir/common';
import { decodeIndex, isCoordinate, type TreeHandle } from '../src/read.ts';

const rs = await createEngine(rust, { nodeStorage: 'object' });

type Sides = Required<Pick<TreeHandle, 'triviaSide' | 'writeTriviaSide'>>;

/** The descendant indexes of a parsed source file's statements, and its tree's trivia sides. */
function parsed(source: string): { statements: number[]; sides: Sides } {
	const { root, tree } = rs.diagnostics.parseAndRead(source);
	const handle: TreeHandle = tree;
	const { triviaSide, writeTriviaSide } = handle;
	if (triviaSide === undefined || writeTriviaSide === undefined) throw new Error('a parsed tree reads its trivia sides');
	const statements = (root as unknown as { _statements: unknown[] })._statements.map((statement) => {
		if (!isCoordinate(statement)) throw new Error('expected a coordinate');
		return decodeIndex(statement.$treeHandle);
	});
	return { statements, sides: { triviaSide, writeTriviaSide } };
}

describe('the trivia table through the tree handle', () => {
	it("reads a parsed function's leading comment as its coordinate, and the blank line after it, where the options write one break, as layout", () => {
		const { statements, sides } = parsed('// c\n\nfn f() {}\n');
		const [comment, layout, ...rest] = sides.triviaSide(statements[0] ?? -1, 'leading') ?? [];
		if (!isCoordinate(comment)) throw new Error('expected the comment as a coordinate');
		expect([comment.$type, comment.$span]).toEqual([rs.kinds.LineComment, { start: 0, end: 4 }]);
		expect(layout).toBe(rs.kinds.Blankline);
		expect(rest).toEqual([]);
	});

	it("reads a write to a statement's side back, and leaves its sibling's sides as the parse placed them", () => {
		const { statements, sides } = parsed('fn f() {}\n// c\nfn g() {}\n');
		const [f = -1, g = -1] = statements;
		const placed = sides.triviaSide(f, 'trailing');
		expect(sides.triviaSide(g, 'leading')).not.toEqual([]);
		sides.writeTriviaSide(g, 'leading', []);
		expect(sides.triviaSide(g, 'leading')).toEqual([]);
		expect(sides.triviaSide(f, 'trailing')).toEqual(placed);
	});

	it('refuses a side that is none of the three', () => {
		const { sides } = parsed('fn f() {}\n');
		expect(() => sides.triviaSide(0, 'outer' as 'inner')).toThrow(/is not a trivia side/);
	});
});
