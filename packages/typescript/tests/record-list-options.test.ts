import { describe, expect, it } from 'vitest';
import { useRecordConstruction } from '@sittir/common/engine';
import arena from '../src/arena.ts';

const objects = await arena.createEngine();
const records = await arena.createEngine();
useRecordConstruction(records, await import('../src/factories/records.ts'));

type List = Iterable<unknown> & { readonly separator?: number };

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
});
