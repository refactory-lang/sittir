import { describe, expect, it } from 'vitest';
import { writeUnitSides } from '@sittir/common/utils';
import { constructions } from './constructions.mts';

const source = 'fn f() {\n    /* c */ ;\n    x();\n}\n';
const kept = '{\n    /* c */ ;\n    x();\n}';
const dropped = '{\n    ;\n    x();\n}';

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

	it('takes a write over the sides a rebuild carries, before its first render', () => {
		const block = rebuilt(parsed());
		writeUnitSides(block, []);
		expect(rendered(block)).toBe(dropped);
	});

	it('keeps them in a rebuild rendered after another rebuild was released unrendered', () => {
		const block = rebuilt(parsed());
		const other = rebuilt(parsed()) as Block & Disposable;
		other[Symbol.dispose]();
		expect(rendered(block)).toBe(kept);
	});
});
