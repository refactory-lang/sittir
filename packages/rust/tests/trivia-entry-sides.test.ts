import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

const rs = await createEngine(rust);
const b = rs.build;
const L = b.layout;

type Side = 'leading' | 'trailing';
type Sided = { readonly $trivia: { leading(...items: never[]): unknown; trailing(...items: never[]): unknown } };

const comment = () => b.blockComment(b.blockCommentRegular(' c '));
const statement = (name: string) => b.expressionStatement(b.identifier(name));
const withSide = <N extends Sided>(node: N, side: Side, entries: readonly unknown[]): N => {
	if (entries.length === 0) return node;
	if (side === 'leading') node.$trivia.leading(...(entries as never[]));
	else node.$trivia.trailing(...(entries as never[]));
	return node;
};
const sided = (before: readonly unknown[], after: readonly unknown[]) => withSide(withSide(comment(), 'leading', before), 'trailing', after);
const rendered = (held: unknown) => b.functionItem({ name: b.identifier('f'), parameters: b.parameters(), body: b.block({ statements: [statement('a'), held as never, statement('z')] }) }).$render();

const shapes: readonly [string, Side, readonly unknown[], readonly unknown[]][] = [
	['leading: space | comment | space', 'leading', [L.space], [L.space]],
	['leading: newline | comment | newline', 'leading', [L.newline], [L.newline]],
	['leading: comment | space', 'leading', [], [L.space]],
	['leading: space | comment', 'leading', [L.space], []],
	['leading: blankline | comment | tight', 'leading', [L.blankline], [L.tight]],
	['trailing: space | comment | space', 'trailing', [L.space], [L.space]],
	['trailing: newline | comment', 'trailing', [L.newline], []],
	['trailing: comment | newline', 'trailing', [], [L.newline]]
];

describe("an entry's own sides are its neighbours in the side that holds it", () => {
	it.each(shapes)('%s', (_, side, before, after) => {
		const nested = withSide(statement('x'), side, [sided(before, after)]);
		const flat = withSide(statement('x'), side, [...before, comment(), ...after]);
		expect(rendered(nested)).toBe(rendered(flat));
	});

	it('leaves nothing on the line a trailing comment breaks from when its own leading side is the break', () => {
		expect(rendered(withSide(statement('x'), 'trailing', [sided([L.newline], [])]))).toBe('fn f() {\n    a;\n    x;\n    /* c */\n    z;\n}');
	});
});
