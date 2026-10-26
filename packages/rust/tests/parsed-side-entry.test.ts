import { describe, expect, it } from 'vitest';
import { rebuilt } from '@sittir/common/utils';
import { constructions } from './constructions.mts';

type Sided = { readonly $trivia: { trailing(...items: unknown[]): readonly unknown[] } };
type Item = { body(): { statements(): readonly Sided[] } };

describe.each(constructions)('a parsed comment in a side is read by reference (%s)', (_, rs) => {
	const b = rs.build;
	const rendered = (node: unknown) => rs.render(node as never).toString();
	const parsedComment = () => (rs.parse('fn f() {\n    x(); /* c */\n}\n').statements()[0] as unknown as Item).body().statements()[0]!.$trivia.trailing()[0] as object;

	it("renders in a built node's side and reads back as itself", () => {
		const comment = parsedComment();
		const built = b.expressionStatement(b.identifier('y')) as unknown as Sided;
		built.$trivia.trailing(comment);
		expect(rendered(built)).toBe('y; /* c */');
		expect(built.$trivia.trailing()[0]).toBe(comment);
	});

	it("renders in a side of another tree's parsed node and reads back as itself", () => {
		const comment = parsedComment();
		const holder = rs.parse('fn g() {\n    z();\n}\n').statements()[0] as unknown as Item;
		const target = holder.body().statements()[0]!;
		target.$trivia.trailing(comment);
		expect(rendered(holder)).toBe('fn g() {\n    z(); /* c */\n}');
		expect(target.$trivia.trailing()[0]).toBe(comment);
	});

	it("carries a parsed unit's comment into a block built from its block, by reference", () => {
		const parsed = (rs.parse('fn f() {\n    /* c */ ;\n    x();\n}\n').statements()[0] as unknown as Item).body();
		const result = rebuilt(parsed, undefined, () => b.block({ statements: [...parsed.statements()] as never }));
		expect(rendered(result)).toBe('{\n    /* c */ ;\n    x();\n}');
		expect(JSON.stringify(result)).toBe(JSON.stringify(parsed));
	});
});
