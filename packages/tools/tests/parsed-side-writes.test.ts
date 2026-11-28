import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { builtRefOf } from '../../common/src/built-ref.ts';
import { indexOf } from '../../common/src/node-data.ts';
import { writeTrivia, writeUnitSides } from '../../common/src/utils.ts';
import python from '../../python/src/index.ts';
import rust from '../../rust/src/index.ts';
import typescript from '../../typescript/src/index.ts';

const STORAGES = ['object', 'arena'] as const;

const addon = createRequire(import.meta.url)('../../rust/native/index.cjs') as Record<string, unknown>;
const called: string[] = [];
for (const [name, value] of Object.entries(addon)) {
	if (typeof value !== 'function' || name === 'SittirEngine' || /^[A-Z]/.test(name)) continue;
	addon[name] = function (this: unknown, ...args: unknown[]) {
		called.push(name);
		return (value as (...args: unknown[]) => unknown).apply(this, args);
	};
}

const statement = (root: any, n = 0): any => root.$query().$descendants.ofType(rust.kinds.ExpressionStatement).at(n);

describe.each(STORAGES)('a side write on a parsed node (%s storage)', (nodeStorage) => {
	it.each([
		['rust', rust, "// a file\nfn f(a: i32,  b: i32) -> i32 {\n    // leading\n    let x = g(a, b);\n    if x > 0 {\n        h(x, /* inside */ 1);\n    }\n    x\n}\n\nstruct S { a: i32, b: u8 }\n"],
		['python', python, 'class C:\n    # comment\n    def f(self, a,  b):\n        if a:\n            return [a, b]\n        return None\n\n\ndef g():\n    while x:\n        y(1, 2)\n'],
		['typescript', typescript, 'const a = [1, 2,  3]\nfunction f(x: number, y: number) {\n  // note\n  if (x) {\n    g(x, y)\n  }\n  return { x, y }\n}\nclass K {\n  m() { return 1 }\n}\n']
	] as const)('%s: a node whose leading side is written back with the entries it holds renders as its source', async (_, language, source) => {
		using engine: any = await createEngine(language as any, { nodeStorage });
		const root = engine.parse(source);
		const node = root.$query().$descendants.ofType((language as any).kinds.ExpressionStatement).at(0);
		writeTrivia(node, { leading: [...node.$trivia.leading()] });
		expect(String(root.$render())).toBe(source);
	});

	it('is the side the next read gives, and replaces the bytes its parse placed there from where they start to where the node ends', async () => {
		using rs: any = await createEngine(rust, { nodeStorage });
		const root = rs.parse('fn f() {\n    // why\n    a;\n}\n');
		const node = statement(root);
		expect(node.$trivia.leading()).toHaveLength(1);
		writeTrivia(node, { leading: [] });
		writeTrivia(node, { trailing: [] });
		expect(node.$trivia.leading()).toEqual([]);
		expect(String(root.$render())).toBe('fn f() {\n    a;\n}\n');
		writeTrivia(node, { leading: [rs.build.lineComment(' new')], trailing: [rs.build.blockComment(rs.build.blockCommentRegular(' t '))] });
		expect(String(root.$render())).toBe('fn f() {\n    // new\n    a; /* t */\n}\n');
	});

	it('renders the node it is written to from its entries and leaves every other node as its source', async () => {
		using rs: any = await createEngine(rust, { nodeStorage });
		const root = rs.parse('fn f() {\n    g(/* inside */);\n    h();\n}\n\nfn k() {}\n');
		statement(root, 1).$trivia.leading(rs.build.lineComment(' written'));
		expect(String(root.$render())).toBe('fn f() {\n    g(/* inside */);\n    // written\n    h();\n}\n\nfn k() {}\n');
	});

	it("writes a unit's side at the bytes the unit spans", async () => {
		using rs: any = await createEngine(rust, { nodeStorage });
		const root = rs.parse('fn a() {}\n/* c */ ;\nfn b() {}\n');
		writeUnitSides(root, [{ slot: '_statements', item: 1, trailing: [rs.build.lineComment(' t')] }]);
		expect(String(root.$render())).toBe('fn a() {}\n/* c */ ; // t\nfn b() {}\n');
	});
});

describe('a side write on a parsed node, in arena storage', () => {
	it('crosses to native only to view the chunks its parse wrote and to give back a list it replaced, and for a unit, the bytes the unit spans', async () => {
		using rs: any = await createEngine(rust, { nodeStorage: 'arena' });
		const root = rs.parse('fn f() {\n    // why\n    a;\n}\n/* c */ ;\n');
		const node = statement(root);
		const comment = rs.build.lineComment(' new');
		called.length = 0;
		writeTrivia(node, { leading: [comment], trailing: [] });
		expect(called.filter((name) => name !== 'readWords' && name !== 'releaseBuilt')).toEqual([]);
		called.length = 0;
		writeUnitSides(root, [{ slot: '_statements', item: 1, trailing: [comment] }]);
		expect(called.filter((name) => name !== 'readWords' && name !== 'releaseBuilt')).toEqual(['readUnitSpan']);
		expect(String(root.$render())).toBe('fn f() {\n    // new\n    a;\n}\n/* c */ ; // new\n');
	});

	it('refuses an inner side on a node that is not empty, as the trivia surface does', async () => {
		using ts: any = await createEngine(typescript, { nodeStorage: 'arena' });
		const root = ts.parse('x([/* A */ a, /* B */ b]);\n');
		const array = root.$query().$descendants.ofType(typescript.kinds.Array).at(0);
		expect(() => array.$trivia.inner(ts.build.comment('/* c */'))).toThrow('trivia: array is not empty; attach to a child with leading/trailing');
		const { arena } = builtRefOf(root)!;
		expect(() => arena.writeSide(indexOf(array)!, 'inner', [])).toThrow(/an inner side on a node that is not empty/);
		expect(String(root.$render())).toBe('x([/* A */ a, /* B */ b]);\n');
	});
});
