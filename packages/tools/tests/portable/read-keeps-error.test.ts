// A parse ERROR is source content: wherever the parse puts it, the portable
// read carries the node that holds it, and that node builds back as its
// source, in both storages. An ERROR before a flag's keyword is passed to the
// slot the flag qualifies, so every render writes it. A side written inside
// its holder renders the holder's source around the side, so the ERROR stays
// where the source has it, while a rebuild writes it after the keyword. A
// comment is trivia and keeps its own placement.
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { portableRuntime, type PortableCarry, type PortableRuntime } from '@sittir/common/engine';
import { sharedEngine } from '@sittir/common/testing';
import type { LanguageAPI } from '@sittir/types';
import python from '../../../python/src/index.ts';
import rust from '../../../rust/src/index.ts';
import typescript from '../../../typescript/src/index.ts';

type Grammar = 'python' | 'rust' | 'typescript';

const ROWS: readonly (readonly [Grammar, string, number])[] = [
	['python', 'def f():\n    x = 1 @\n', python.kinds.FunctionDefinition],
	['python', 'if x:\n    y $\n', python.kinds.IfStatement],
	['typescript', 'function f() { @ }\n', typescript.kinds.FunctionDeclaration],
	['rust', 'fn f(mut @ self) {}\n', rust.kinds.SelfParameter],
	['rust', 'fn f(&mut @ self) {}\n', rust.kinds.SelfParameter],
	['rust', 'fn f(& @ self) {}\n', rust.kinds.SelfParameter],
	['rust', 'fn f() {\n    let y = &mut @ x;\n}\n', rust.kinds.Identifier],
	['rust', 'fn f() {\n    let y = &raw mut @ x;\n}\n', rust.kinds.Identifier],
	['rust', 'extern crate @ foo;\n', rust.kinds.Identifier],
	['rust', 'fn f(x: *mut @ u8) {}\n', rust.kinds.PointerTypeMut],
	['rust', 'pub(@ crate) fn f() {}\n', rust.kinds.FunctionItem],
	['typescript', "let x = import @ ('a');\n", typescript.kinds.CallExpressionCall],
	['typescript', 'let x = a ?. @ b;\n', typescript.kinds.MemberExpression],
	['typescript', 'for (let x of xs) { @ f(x); }\n', typescript.kinds.ForInStatement],
	['typescript', 'function g() { @ ; }\n', typescript.kinds.FunctionDeclaration]
];

const MOVED: readonly (readonly [string, string, string, string])[] = [
	['fn f() {\n    let y = & @ mut x;\n}\n', 'x', 'fn f() {\n    let y = &mut @ x;\n}\n', 'fn f() {\n    let y = & @ mut x /* r */;\n}\n'],
	['fn f() {\n    let @ mut x = 1;\n}\n', 'x', 'fn f() {\n    let mut @ x = 1;\n}\n', 'fn f() {\n    let @ mut x /* r */ = 1;\n}\n'],
	['static @ mut X: i32 = 1;\n', 'X', 'static mut @ X: i32 = 1;\n', 'static @ mut X /* r */: i32 = 1;\n']
];

const BLOCK_COMMENTED: readonly (readonly [string, string])[] = [
	['def f():\n    x = 1 @\n', 'def f():\n    x = 1 @ # r\n'],
	['if x:\n    y $\n', 'if x:\n    y $ # r\n']
];

type RoundTrip = { readonly carried: readonly (readonly [number, PortableCarry])[]; readonly built: string };

const roundTripThrough =
	<API extends LanguageAPI>(runtime: PortableRuntime<API>, parse: (source: string) => { readonly $type: number }, render: (node: unknown) => unknown) =>
	(source: string): RoundTrip => {
		const carried: (readonly [number, PortableCarry])[] = [];
		const read = runtime.read(parse(source), (node, carry) => carried.push([node.$type, carry]));
		return { carried, built: String(render(runtime.build(read as never))) };
	};

describe.each(['object', 'arena'] as const)('a read never drops an ERROR, in %s storage', async (nodeStorage) => {
	const py = await portableRuntime(await sharedEngine(() => createEngine(python, { api: 'strict', nodeStorage })));
	const rs = await portableRuntime(await sharedEngine(() => createEngine(rust, { api: 'strict', nodeStorage })));
	const ts = await portableRuntime(await sharedEngine(() => createEngine(typescript, { api: 'strict', nodeStorage })));
	const roundTrip: Record<Grammar, (source: string) => RoundTrip> = {
		python: roundTripThrough(py, (source) => py.engine.parse(source), (node) => py.engine.render(node as never)),
		rust: roundTripThrough(rs, (source) => rs.engine.parse(source), (node) => rs.engine.render(node as never)),
		typescript: roundTripThrough(ts, (source) => ts.engine.parse(source), (node) => ts.engine.render(node as never))
	};

	it.each(ROWS)('%s %j carries the node of kind %i that holds the ERROR, and builds its source back', (grammar, source, kind) => {
		const { carried, built } = roundTrip[grammar](source);
		expect(carried.filter(([, carry]) => carry.reason === 'error')).toEqual([[kind, { reason: 'error' }]]);
		expect(built).toBe(source);
	});

	it.each(MOVED)('%j carries the identifier the flag qualifies, and builds the ERROR back after the keyword', (source, _name, built) => {
		expect(roundTrip.rust(source)).toEqual({ carried: [[rust.kinds.Identifier, { reason: 'error' }]], built });
	});

	it.each(MOVED)('%j keeps the ERROR when a comment is written after %s', (source, name, _built, edited) => {
		const root = rs.engine.parse(source);
		const slot = [...root.$query().$descendants.ofType(rust.kinds.Identifier)].find((node) => typeof node === 'object' && node.$text() === name);
		if (slot === undefined || typeof slot !== 'object') throw new Error(`expected the identifier ${name}`);
		slot.$trivia.trailing(rs.engine.build.blockComment(rs.engine.build.blockCommentRegular(' r ')));
		expect(String(root.$render())).toBe(edited);
	});

	it.each(BLOCK_COMMENTED)('%j keeps the ERROR when a comment is written after its block', (source, edited) => {
		const root = py.engine.parse(source);
		const block = root.$query().$descendants.ofType(python.kinds.Block).at(0);
		if (block === undefined || typeof block !== 'object') throw new Error('expected a block');
		block.$trivia.trailing(py.engine.build.comment(' r'));
		expect(String(root.$render())).toBe(edited);
	});

	for (const [source] of MOVED) it.todo(`${JSON.stringify(source)} builds back exactly once a rebuilt node renders its source runs, in both storages`);

	it("rebuilds a comment between a self parameter's tokens without it, carrying nothing", () => {
		expect(roundTrip.rust('fn f(&mut /*c*/ self) {}\n')).toEqual({ carried: [], built: 'fn f(&mut self) {}\n' });
	});
});
