import { describe, expect, it } from 'vitest';
import typescript from '../src/index.ts';

const objects = await typescript.createEngine({ nodeStorage: 'object' });
const records = await typescript.createEngine();

type List = Iterable<unknown> & { readonly separator?: number; readonly $with: { items(...items: unknown[]): List } };

function withComma(engine: typeof objects): List {
	const alias = engine.parse('type T = { a: string; b: number };').statements()[0] as unknown as { value(): { members(): List } };
	const build = engine.build as unknown as { objectTypeContent(options: object, ...items: unknown[]): List };
	return build.objectTypeContent({ separator: engine.kinds.Comma }, ...alias.value().members());
}

describe('a built list that chooses its separator', () => {
	it('reads back the separator it was built with, as the object builders do', () => {
		expect(withComma(records).separator).toBe(records.kinds.Comma);
		expect(withComma(objects).separator).toBe(objects.kinds.Comma);
	});

	it('renders with it, as the object builders render the same list', () => {
		expect(records.render(withComma(records) as never).toString()).toBe(objects.render(withComma(objects) as never).toString());
	});

	it('keeps it through a $with of its items, which reads it from the record', () => {
		const reversed = (engine: typeof objects) => {
			const list = withComma(engine);
			return engine.render(list.$with.items(...[...list].reverse()) as never).toString();
		};
		expect(reversed(records)).toBe('b: number,\na: string,');
		expect(reversed(records)).toBe(reversed(objects));
	});
});
