import { describe, expect, it } from 'vitest';
import rust from '@sittir/rust';
import { createEngine } from '../src/create-engine.ts';
import { classifierOf, flagHolds, hasKind, portableTextOf } from '../src/portable/classify.ts';
import { portableReader, type PortableCarry } from '../src/portable/read.ts';

const engine = await createEngine(rust, { api: 'strict' });
const rows = engine.portable!;
const table = await (await rust.load()).portableBuild!();
const classify = classifierOf(rows);
const read = portableReader({
	table,
	classify: (value) => (hasKind(value) && value.$type === rust.kinds.StringLiteral ? 'literal.string' : classify(value)),
	flagHolds: (value, flag) => flagHolds(rows, value, flag),
	flagsOf: (kind) => Object.keys(rows.flags[kind] ?? {}),
	textOf: (value) => portableTextOf(rows, value)
});

describe('the portable read of an arm whose presets the node contradicts', () => {
	it('carries the node instead of reading it through an arm that would rebuild it differently', () => {
		const carries: { readonly text: string; readonly carry: PortableCarry }[] = [];
		read(engine.parse('fn f() {\n    let c = c"foo";\n    let s = "x";\n}\n'), (node, carry) => carries.push({ text: String(engine.render(node as never)), carry }));
		expect(carries).toEqual([{ text: 'c"foo"', carry: { reason: 'preset' } }]);
	});
});
