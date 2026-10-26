import { describe, expect, it } from 'vitest';
import { writeUnitSides } from '@sittir/common/utils';
import { constructions } from './constructions.mts';

const source = 'fn f() {\n    /* c */ ;\n    x();\n}\n';
const kept = '{\n    /* c */ ;\n    x();\n}';

type Block = { statements(): Iterable<unknown>; readonly $with: { statements(...items: unknown[]): Block } };

describe.each(constructions)("a unit's sides through a rebuild (%s)", (_, rs) => {
	const parsed = () => (rs.parse(source).statements()[0] as unknown as { body(): Block }).body();
	const rebuilt = (block: Block) => block.$with.statements(...block.statements());
	const rendered = (block: Block) => rs.render(block as never).toString();

	it('keeps them in a rebuild of the parsed block', () => {
		expect(rendered(rebuilt(parsed()))).toBe(kept);
	});

	it('keeps them in a rebuild of a rebuild', () => {
		expect(rendered(rebuilt(rebuilt(parsed())))).toBe(kept);
	});

	it('refuses the sides of one unit given twice, before either is written', () => {
		const block = rs.build.block({ statements: [...parsed().statements()] as never });
		const comment = rs.build.blockComment(rs.build.blockCommentRegular(' d '));
		expect(() => writeUnitSides(block, [{ slot: '_statements', item: 0, leading: [comment] }, { slot: '_statements', item: 0, trailing: [] }])).toThrow(
			'trivia: the sides of the unit at _statements[0] are given twice'
		);
		expect(rendered(block as never)).toBe('{\n    ;\n    x();\n}');
	});
});
