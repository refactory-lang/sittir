import { describe, expect, it } from 'vitest';
import rust from '@sittir/rust';
import { createEngine } from '@sittir/common';
import { decodeIndex, isCoordinate, type TreeHandle } from '../src/read.ts';

const rs = await createEngine(rust);

type Sides = Required<Pick<TreeHandle, 'triviaSide' | 'writeTriviaSide' | 'editedWithin'>>;

/** The descendant indexes of a parsed source file's statements, and its tree's trivia sides. */
function parsed(source: string): { statements: number[]; sides: Sides } {
	const { root, tree } = rs.diagnostics.parseAndRead(source);
	const handle: TreeHandle = tree;
	const { triviaSide, writeTriviaSide, editedWithin } = handle;
	if (triviaSide === undefined || writeTriviaSide === undefined || editedWithin === undefined) throw new Error('a parsed tree reads its trivia sides');
	const statements = (root as unknown as { _statements: unknown[] })._statements.map((statement) => {
		if (!isCoordinate(statement)) throw new Error('expected a coordinate');
		return decodeIndex(statement.$treeHandle);
	});
	return { statements, sides: { triviaSide, writeTriviaSide, editedWithin } };
}

describe('the trivia table through the tree handle', () => {
	it("reads a parsed function's leading comment as its coordinate, and the line break after it as layout", () => {
		const { statements, sides } = parsed('// c\nfn f() {}\n');
		const [comment, layout, ...rest] = sides.triviaSide(statements[0] ?? -1, 'leading');
		if (!isCoordinate(comment)) throw new Error('expected the comment as a coordinate');
		expect([comment.$type, comment.$span]).toEqual([rs.kinds.LineComment, { start: 0, end: 4 }]);
		expect(layout).toMatchObject({ $type: expect.any(Number), $sameLine: true });
		expect(rest).toEqual([]);
	});

	it('marks the root edited after a write to a statement, and leaves its sibling unedited', () => {
		const { statements, sides } = parsed('fn f() {}\n// c\nfn g() {}\n');
		const [f = -1, g = -1] = statements;
		expect(sides.editedWithin(0, false)).toBe(false);
		sides.writeTriviaSide(g, 'leading', []);
		expect(sides.triviaSide(g, 'leading')).toEqual([]);
		expect(sides.editedWithin(0, false)).toBe(true);
		expect(sides.editedWithin(f, false)).toBe(false);
		expect(sides.editedWithin(g, false)).toBe(false);
		expect(sides.editedWithin(g, true)).toBe(true);
	});

	it('refuses a side that is none of the three', () => {
		const { sides } = parsed('fn f() {}\n');
		expect(() => sides.triviaSide(0, 'outer' as 'inner')).toThrow(/is not a trivia side/);
	});
});
