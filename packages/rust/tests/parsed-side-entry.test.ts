import { describe, expect, it } from 'vitest';
import { hydrateTriviaEntry, rebuilt } from '@sittir/common/utils';
import { unitSidesOf } from '../../common/src/node-data.ts';
import { constructions } from './side-nesting.mts';

type Sided = { readonly $trivia: { trailing(...items: unknown[]): readonly unknown[] } };
type Item = { body(): { statements(): readonly Sided[] } };

const commentJSON = (text: string) => ({ $type: 'block_comment', content: { $type: 'block_comment_regular', $text: text } });

describe.each(constructions)('a parsed comment in a side is read by reference (%s)', (_, rs) => {
	const b = rs.build;
	const later = () => b.blockComment(b.blockCommentRegular(' later '));
	const rendered = (node: unknown) => rs.render(node as never).toString();
	const parsedComment = () => (rs.parse('fn f() {\n    x(); /* c */\n}\n').statements()[0] as unknown as Item).body().statements()[0]!.$trivia.trailing()[0] as Sided;

	it("renders in a built node's side, reads back as itself, and shows a side written on it later", () => {
		const comment = parsedComment();
		const built = b.expressionStatement(b.identifier('y')) as unknown as Sided;
		built.$trivia.trailing(comment);
		expect(rendered(built)).toBe('y; /* c */');
		expect(built.$trivia.trailing()[0]).toBe(comment);
		comment.$trivia.trailing(later());
		expect(rendered(built)).toBe('y; /* c */ /* later */');
		expect((JSON.parse(JSON.stringify(built)) as { trailingComments: unknown }).trailingComments).toEqual([{ ...commentJSON(' c '), trailingComments: [commentJSON(' later ')] }]);
	});

	it("renders in a side of another tree's parsed node, reads back as itself, and shows a side written on it later", () => {
		const comment = parsedComment();
		const holder = rs.parse('fn g() {\n    z();\n}\n').statements()[0] as unknown as Item;
		const target = holder.body().statements()[0]!;
		target.$trivia.trailing(comment);
		expect(rendered(holder)).toBe('fn g() {\n    z(); /* c */\n}');
		expect(target.$trivia.trailing()[0]).toBe(comment);
		comment.$trivia.trailing(later());
		expect(rendered(holder)).toBe('fn g() {\n    z(); /* c */ /* later */\n}');
		expect(JSON.stringify(holder)).toContain(JSON.stringify([{ ...commentJSON(' c '), trailingComments: [commentJSON(' later ')] }]));
	});

	it("carries a parsed unit's comment into a block built from its block, by reference", () => {
		const parsed = (rs.parse('fn f() {\n    /* c */ ;\n    x();\n}\n').statements()[0] as unknown as Item).body();
		const result = rebuilt(parsed, undefined, () => b.block({ statements: [...parsed.statements()] as never }));
		expect(rendered(result)).toBe('{\n    /* c */ ;\n    x();\n}');
		expect(JSON.stringify(result)).toBe(JSON.stringify(parsed));
		const unit = (unitSidesOf(parsed) as readonly { readonly leading: readonly unknown[] }[])[0]!;
		(hydrateTriviaEntry(unit.leading[0]) as unknown as Sided).$trivia.trailing(later());
		expect(rendered(result)).toBe('{\n    /* c */ /* later */ ;\n    x();\n}');
		expect(JSON.stringify(result)).toBe(JSON.stringify(parsed));
	});
});
