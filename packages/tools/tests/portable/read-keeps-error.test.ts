// A parse ERROR is source content: wherever the parse puts it, the portable
// read carries the node that holds it, and that node builds back as its
// source, in both storages. A comment is trivia and keeps its own placement.
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
	['rust', 'fn f() {\n    let y = & @ mut x;\n}\n', rust.kinds.ReferenceExpressionMut],
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

	it("rebuilds a comment between a self parameter's tokens without it, carrying nothing", () => {
		expect(roundTrip.rust('fn f(&mut /*c*/ self) {}\n')).toEqual({ carried: [], built: 'fn f(&mut self) {}\n' });
	});
});
