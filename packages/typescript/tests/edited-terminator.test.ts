import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { sharedEngine } from '@sittir/common/testing';
import type { TreeHandle } from '@sittir/common/utils';
import typescript from '../src/index.ts';

const engines = {
	arena: await sharedEngine(() => createEngine(typescript, { nodeStorage: 'arena' })),
	object: await sharedEngine(() => createEngine(typescript, { nodeStorage: 'object' }))
};

const editedRender = (engine: (typeof engines)['arena'], source: string, text: string): string => {
	const { root, tree } = engine.diagnostics.parseAndRead(source) as { root: never; tree: TreeHandle };
	const end = (tree.read!(0, 1) as { $_layout: { at: { $end: number } } }).$_layout.at.$end;
	const index = Array.from({ length: end }, (_, at) => at).find((at) => {
		const read = tree.read!(at, 1) as { $_layout?: { at?: { $span: { start: number; end: number } } } };
		const span = typeof read === 'object' ? read.$_layout?.at?.$span : undefined;
		return span !== undefined && source.slice(span.start, span.end) === text;
	});
	if (index === undefined) throw new Error(`no node spells ${JSON.stringify(text)}`);
	tree.writeTriviaSide!(index, 'inner', [...(tree.triviaSide!(index, 'inner') ?? [])]);
	return engine.render(root).toString();
};

describe.each(Object.keys(engines) as (keyof typeof engines)[])('a statement edited inside keeps its source terminator gap (%s storage)', (storage) => {
	it.each([
		['const x = y;\n', 'x'],
		["foo('a');\n", 'foo'],
		['export { A };\n', '{ A }'],
		["export type { A } from './z.ts';\n", '{ A }'],
		["import { A } from './z.ts';\n", '{ A }'],
		["import { A } from './z.ts' ;\n", '{ A }']
	])('%j, edited at %j, renders on source', (source, text) => {
		expect(editedRender(engines[storage], source, text)).toBe(source);
	});
});
