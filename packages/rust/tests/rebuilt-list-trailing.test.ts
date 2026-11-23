import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { Delimiter } from '@sittir/common/utils';
import rust from '../src/index.ts';

const SOURCE = 'fn main() { f(a, b,); }\n';

interface List extends Iterable<unknown> {
	readonly $with: { items(...items: unknown[]): List; delimiter(value: unknown): List };
	$render(): string;
}

const listOf = (engine: { parse(source: string): unknown; readonly kinds: { readonly ArgumentsElements: number } }): List => (engine.parse(SOURCE) as any).$query().$descendants.ofType(engine.kinds.ArgumentsElements).at(0);

describe.each(['object', 'arena'] as const)('a rebuilt list and its delimiter (%s storage)', (nodeStorage) => {
	it('a_cleared_delimiter_takes_the_options', async () => {
		using plain = await createEngine(rust, { nodeStorage });
		const list = listOf(plain);
		expect(list.$with.items(...list).$render()).toBe('a, b,');
		const cleared = list.$with.delimiter(undefined);
		expect(cleared.$with.items(...list).$render()).toBe('a, b');

		using trailing = await createEngine(rust, { nodeStorage, render: { argumentsElements: { item: { delimiter: Delimiter.Trailing } } } });
		const other = listOf(trailing);
		expect(other.$with.delimiter(undefined).$with.items(...other).$render()).toBe('a, b,');
	});
});
