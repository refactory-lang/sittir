import { describe, expect, it } from 'vitest';
import { writeUnitSides } from '@sittir/common/utils';
import { constructions, records } from './constructions.mts';

const source = 'fn f() {\n    /* c */ ;\n    x();\n}\n';
const kept = '{\n    /* c */ ;\n    x();\n}';

type Block = { statements(): Iterable<unknown>; readonly $with: { statements(...items: unknown[]): Block } };

describe.each(constructions)("a unit's sides through a rebuild and a JSON revival (%s)", (_, rs) => {
	const parsed = () => (rs.parse(source).statements()[0] as unknown as { body(): Block }).body();
	const rebuilt = (block: Block) => block.$with.statements(...block.statements());
	const revived = (block: Block) => JSON.parse(JSON.stringify(block), rs.reviver) as Block;
	const rendered = (block: Block) => rs.render(block as never).toString();

	it('keeps them in a rebuild of the parsed block', () => {
		expect(rendered(rebuilt(parsed()))).toBe(kept);
	});

	it('keeps them in a revival, and in a rebuild of it', () => {
		const back = revived(parsed());
		expect(rendered(back)).toBe(kept);
		expect(rendered(rebuilt(back))).toBe(kept);
	});

	it('refuses the sides of one unit given twice, before either is written', () => {
		const block = rs.build.block({ statements: [...parsed().statements()] as never });
		const comment = rs.build.blockComment(rs.build.blockCommentRegular(' d '));
		expect(() => writeUnitSides(block, [{ slot: '_statements', item: 0, leading: [comment] }, { slot: '_statements', item: 0, trailing: [] }])).toThrow(
			'trivia: the sides of the unit at _statements[0] are given twice'
		);
		expect(rendered(block as never)).toBe('{\n    ;\n    x();\n}');
	});

	it('writes them to JSON as the parsed block does', () => {
		const block = parsed();
		expect(JSON.stringify(rebuilt(block))).toBe(JSON.stringify(block));
		expect(JSON.stringify(revived(block))).toBe(JSON.stringify(block));
		expect(JSON.stringify(rebuilt(revived(block)))).toBe(JSON.stringify(block));
	});
});

it("keeps a revived record's unit sides only in its engine's store", () => {
	const block = (records.parse(source).statements()[0] as unknown as { body(): Block }).body();
	const back = JSON.parse(JSON.stringify(block), records.reviver) as Block & { readonly $_layout?: { readonly units?: unknown } };
	expect(back.$_layout?.units).toBeUndefined();
	expect(records.render(back as never).toString()).toBe(kept);
});
