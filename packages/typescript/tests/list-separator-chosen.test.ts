import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import typescript from '../src/index.ts';

const ts = await createEngine(typescript);

const itemsOf = (source: string) => [...(ts.parse(source).statements()[0] as any).value().members()];
const rendered = (source: string, options: object) => (ts.build.objectTypeContent(options as never, ...itemsOf(source)) as { $render(): string }).$render();

const MIXED = 'type T = { a: string, b: number; c: boolean };';
const COMMAS = 'type T = { a: string, b: number, c: boolean };';
const SEMIS = 'type T = { a: string; b: number; c: boolean };';

describe('a list built over parsed items renders one separator when it chooses one', () => {
	it.each([
		['mixed', MIXED],
		['all commas', COMMAS],
		['all semicolons', SEMIS]
	])('%s source: a chosen comma is every gap', (_name, source) => {
		expect(rendered(source, { separator: ts.kinds.Comma })).toBe('a: string,\nb: number,\nc: boolean,');
	});

	it.each([
		['mixed', MIXED],
		['all commas', COMMAS],
		['all semicolons', SEMIS]
	])('%s source: a chosen semicolon is every gap', (_name, source) => {
		expect(rendered(source, { separator: ts.kinds.Semi })).toBe('a: string;\nb: number;\nc: boolean;');
	});

});

describe.each(['object', 'arena'] as const)('a list built over parsed items with no separator chosen (%s storage)', (nodeStorage) => {
	it.each([
		['mixed, one gap of each', MIXED, 'a: string;\nb: number;\nc: boolean;'],
		['all commas', COMMAS, 'a: string;\nb: number;\nc: boolean;']
	])('%s source: the list\'s separator, the options\', is every gap', async (_name, source, expected) => {
		using engine = await createEngine(typescript, { nodeStorage });
		const items = [...(engine.parse(source).statements()[0] as any).value().members()];
		expect((engine.build.objectTypeContent({} as never, ...items) as { $render(): string }).$render()).toBe(expected);
	});
});
