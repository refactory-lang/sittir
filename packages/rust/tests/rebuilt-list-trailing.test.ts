import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { Delimiter } from '@sittir/common/utils';
import rust from '../src/index.ts';

interface List extends Iterable<unknown> {
	readonly $with: { items(...items: unknown[]): List; delimiter(value: unknown): List };
	$render(): string;
}

interface Holder {
	readonly $with: { elements(list: unknown): { $render(): string } };
	elements(): Iterable<unknown>;
}

interface Engine {
	parse(source: string): unknown;
	readonly kinds: { readonly ArgumentsElements: number; readonly Parameters: number };
	readonly build: { parametersElements(...items: unknown[]): unknown };
}

const nodeOf = <T>(engine: Engine, source: string, kind: number): T => (engine.parse(source) as any).$query().$descendants.ofType(kind).at(0);

const rebuilt = (engine: Engine, source: string) => {
	const list = nodeOf<List>(engine, source, engine.kinds.ArgumentsElements);
	return [list.$with.items(...list).$render(), list.$with.delimiter(undefined).$with.items(...list).$render()];
};

const seated = (engine: Engine, source: string) => {
	const holder = nodeOf<Holder>(engine, source, engine.kinds.Parameters);
	return holder.$with.elements(engine.build.parametersElements(...holder.elements())).$render();
};

const hoisted = (engine: Engine, source: string) => {
	const [f, g] = (engine.parse(source) as any).statements();
	return f.$with.parameters(...g.parameters()).$render();
};

describe.each(['object', 'arena'] as const)('a rebuilt list and its delimiter (%s storage)', (nodeStorage) => {
	it('a_rebuilt_list_keeps_its_sources_trailing_delimiter', async () => {
		using plain = await createEngine(rust, { nodeStorage });
		const engine = plain as unknown as Engine;
		expect(rebuilt(engine, 'fn main() { f(a, b,); }\n')).toEqual(['a, b,', 'a, b,']);
		expect(seated(engine, 'fn f(a: u8, b: i8,) {}\n')).toBe('(a: u8, b: i8,)');
		expect(hoisted(engine, 'fn f(a: u8, b: u8,) {}\nfn g(c: u8) {}\n')).toBe('fn f(c: u8,) {}');
		expect(hoisted(engine, 'fn f(a: u8, b: u8) {}\nfn g(c: u8) {}\n')).toBe('fn f(c: u8) {}');

		using trailing = await createEngine(rust, { nodeStorage, render: { argumentsElements: { item: { delimiter: Delimiter.Trailing } }, parametersElements: { item: { delimiter: Delimiter.Trailing } } } });
		const other = trailing as unknown as Engine;
		expect(rebuilt(other, 'fn main() { f(a, b); }\n')).toEqual(['a, b', 'a, b']);
		expect(seated(other, 'fn f(a: u8, b: i8) {}\n')).toBe('(a: u8, b: i8)');
	});
});
